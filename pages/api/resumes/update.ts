// pages/api/resumes/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ResumeService } from "@/lib/database/resumeService";
import { UpdateTailoredResumeSchema, UpdateTailoredResumeInput, UpdateResumeSchema, UpdateResumeInput } from "@/lib/validation/schemas";
import { validateRequest, rateLimit } from "@/lib/validation/middleware";
import { StandardApiResponse } from "@/types/resume";

export default async function updateResumeHandler(req: NextApiRequest, res: NextApiResponse<StandardApiResponse<{ updated: boolean }>>) {
  // Check HTTP method
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  // Enhanced logging for debugging
  console.log('=== UPDATE RESUME REQUEST ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request Body Keys:', req.body ? Object.keys(req.body) : 'null');
  console.log('================================');

  try {
    // Apply rate limiting
    const rateLimitResult = await new Promise<boolean>((resolve) => {
      rateLimit(15 * 60 * 1000, 30)(req, res, () => resolve(true));
    }).catch(() => false);

    if (!rateLimitResult) {
      return; // Rate limit response already sent
    }

    // Determine which schema to use based on request content
    const requestBody = req.body || {};
    const requestKeys = Object.keys(requestBody);
    const hasOnlyTailoredResume = requestBody.hasOwnProperty('tailoredResume') && 
      requestKeys.length === 2 && 
      requestBody.id;
    
    console.log('Has only tailored resume fields:', hasOnlyTailoredResume);
    console.log('Request keys count:', requestKeys.length);

    // Check for empty update request (only has id, no fields to update)
    if (requestKeys.length === 1 && requestKeys[0] === 'id') {
      console.log('Empty update request detected - no fields to update');
      return res.status(400).json({
        success: false,
        error: 'No fields provided to update',
        code: 'EMPTY_UPDATE_REQUEST'
      });
    }

    if (hasOnlyTailoredResume) {
      // Use UpdateTailoredResumeSchema for tailored resume only updates
      validateRequest(UpdateTailoredResumeSchema)(req, res, async (validatedData: UpdateTailoredResumeInput) => {
        try {
          const result = await ResumeService.update(validatedData.id, {
            tailoredResume: validatedData.tailoredResume
          });

          if (!result.success) {
            console.error('ResumeService.update failed:', result.error);
            return res.status(400).json({
              success: false,
              error: result.error,
              code: 'UPDATE_FAILED'
            });
          }

          return res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: { updated: true }
          });
        } catch (serviceError) {
          console.error('Service error in update resume (tailored):', serviceError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update resume',
            code: 'SERVICE_ERROR'
          });
        }
      });
    } else {
      // Use UpdateResumeSchema for general updates (jobTitle, jobLink, etc.)
      validateRequest(UpdateResumeSchema)(req, res, async (validatedData: UpdateResumeInput) => {
        try {
          // Extract only the fields that were provided (excluding id)
          const { id, ...updateFields } = validatedData;
          const result = await ResumeService.update(id, updateFields);

          if (!result.success) {
            console.error('ResumeService.update failed:', result.error);
            return res.status(400).json({
              success: false,
              error: result.error,
              code: 'UPDATE_FAILED'
            });
          }

          return res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: { updated: true }
          });
        } catch (serviceError) {
          console.error('Service error in update resume (general):', serviceError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update resume',
            code: 'SERVICE_ERROR'
          });
        }
      });
    }

  } catch (error) {
    console.error('Handler error in update resume:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Request body that caused error:', JSON.stringify(req.body, null, 2));
    
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
        details: {
          stack: error.stack,
          requestBody: req.body
        }
      })
    });
  }
}