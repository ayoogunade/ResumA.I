// pages/api/resumes/tailor-resume.ts
import { tailorResume, analyzeResumeMatch } from '../../../lib/gemini';
import type { NextApiRequest, NextApiResponse } from "next";
import { TailorResumeSchema, TailorResumeInput } from '@/lib/validation/schemas';
import { validateRequest, rateLimit } from '@/lib/validation/middleware';
import { formatTailoredResume } from '@/lib/formatters';
import { StandardApiResponse } from '@/types/resume';

interface TailoredResumeResponse {
  tailoredResume: string;
  analysis?: any;
  originalLength: number;
  optimizedLength: number;
  processingTime: number;
  aiModel: string;
}

export default async function tailorResumeHandler(req: NextApiRequest, res: NextApiResponse<StandardApiResponse<TailoredResumeResponse>>) {
  // Check HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  // Add debugging logs
  console.log('=== TAILOR RESUME REQUEST ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request Body Keys:', req.body ? Object.keys(req.body) : 'null');
  console.log('================================');

  try {
    // Apply rate limiting (more restrictive for AI endpoints)
    const rateLimitResult = await new Promise<boolean>((resolve) => {
      rateLimit(15 * 60 * 1000, 10)(req, res, () => resolve(true));
    }).catch(() => false);

    if (!rateLimitResult) {
      return; // Rate limit response already sent
    }

    // Validate and process request
    validateRequest(TailorResumeSchema)(req, res, async (validatedData: TailorResumeInput) => {
      const startTime = Date.now();
      console.log('Validation passed, starting AI processing...');

      try {
        console.log('Calling tailorResume AI function...');
        // Generate tailored resume with validated input
        const tailoredResume = await tailorResume(validatedData.resumeText, validatedData.jobDescription);
        console.log('tailorResume completed, result length:', tailoredResume?.length || 0);
        
        console.log('Calling analyzeResumeMatch AI function...');
        // Optional: Get analysis (can be disabled for performance)
        let analysis = null;
        try {
          analysis = await analyzeResumeMatch(validatedData.resumeText, validatedData.jobDescription);
          console.log('analyzeResumeMatch completed:', analysis ? 'success' : 'null result');
        } catch (analysisError) {
          console.warn('Analysis failed, continuing without analysis:', analysisError);
          analysis = null;
        }
        
        console.log('Formatting response...');
        // Format the response for better display
        const formattedResume = formatTailoredResume(tailoredResume);
        const processingTime = Date.now() - startTime;
        console.log('About to send response, processing time:', processingTime);

        const responseData = {
          success: true,
          message: 'Resume tailored successfully',
          data: {
            tailoredResume: formattedResume,
            analysis: analysis || undefined,
            originalLength: validatedData.resumeText.length,
            optimizedLength: formattedResume.length,
            processingTime,
            aiModel: 'gemini-2.0-flash'
          }
        };

        console.log('Sending 200 response...');
        res.status(200).json(responseData);
        console.log('Response sent successfully');
        return;

      } catch (aiError) {
        console.error('AI Processing Error:', aiError);
        
        // Specific AI error handling
        let errorMessage = 'AI processing failed';
        let errorCode = 'AI_PROCESSING_FAILED';
        
        if (aiError instanceof Error) {
          if (aiError.message.includes('quota')) {
            errorMessage = 'AI service quota exceeded. Please try again later.';
            errorCode = 'AI_QUOTA_EXCEEDED';
          } else if (aiError.message.includes('timeout')) {
            errorMessage = 'AI processing timed out. Please try again.';
            errorCode = 'AI_TIMEOUT';
          } else if (aiError.message.includes('rate limit')) {
            errorMessage = 'Too many AI requests. Please wait before trying again.';
            errorCode = 'AI_RATE_LIMITED';
          }
        }

        console.log('Sending 503 error response...');
        res.status(503).json({
          success: false,
          error: errorMessage,
          code: errorCode,
          ...(process.env.NODE_ENV === 'development' && { 
            details: aiError instanceof Error ? aiError.message : 'Unknown AI error' 
          })
        });
        console.log('Error response sent');
        return;
      }
    });

  } catch (error) {
    console.error('Handler error in tailor resume:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    console.log('Sending 500 error response from main handler...');
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
    console.log('Main error response sent');
    return;
  }
}