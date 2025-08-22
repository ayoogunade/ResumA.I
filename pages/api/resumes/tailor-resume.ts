// pages/api/resumes/tailor-resume.ts
import { tailorResume, analyzeResumeMatch } from '../../../lib/gemini';
import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"
import { formatTailoredResume } from '@/lib/formatters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeText, jobDescription, jobLink } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description are required' });
    }

    // Generate tailored resume
    const tailoredResume = await tailorResume(resumeText, jobDescription);
    
    // Optional: Get analysis (can be commented out if not needed)
    const analysis = await analyzeResumeMatch(resumeText, jobDescription);
    
    // Format the response for better display
    const formattedResume = formatTailoredResume(tailoredResume);

    // Save to database (your existing logic)
    const client = await clientPromise;
    const db = client.db("resumeAI");
    // ... your database saving code

    res.status(200).json({ 
      success: true, 
      tailoredResume: formattedResume,
      analysis: analysis, // Optional: include match analysis
      originalLength: resumeText.length,
      optimizedLength: formattedResume.length
    });

  } catch (error) {
    console.error('API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to tailor resume';
    const errorDetails = process.env.NODE_ENV === 'development' ? errorMessage : undefined;
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to tailor resume',
      details: errorDetails
    });
  }
}