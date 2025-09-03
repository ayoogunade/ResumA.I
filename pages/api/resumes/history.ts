// pages/api/resumes/history.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ResumeService } from '@/lib/database/resumeService';
import { HistoryQuerySchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/validation/middleware';
import { StandardApiResponse } from '@/types/resume';

export default async function historyHandler(req: NextApiRequest, res: NextApiResponse<StandardApiResponse<any>>) {
  // Check HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Apply rate limiting
    const rateLimitResult = await new Promise<boolean>((resolve) => {
      rateLimit(15 * 60 * 1000, 50)(req, res, () => resolve(true));
    }).catch(() => false);

    if (!rateLimitResult) {
      return; // Rate limit response already sent
    }

    // Validate query parameters
    const queryValidation = HistoryQuerySchema.safeParse(req.query);
    
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY'
      });
    }

    const { limit } = queryValidation.data;
    const result = await ResumeService.findRecent(limit);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        code: 'FETCH_FAILED'
      });
    }

    // Map database field names to frontend expected names for backward compatibility
    const mappedResumes = result.resumes.map(resume => ({
      ...resume,
      OGResume: resume.originalResume, // Map back for frontend compatibility
      _id: resume._id?.toString()
    }));

    return res.status(200).json({
      success: true,
      data: {
        resumes: mappedResumes,
        count: mappedResumes.length,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Handler error in history:', error);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}