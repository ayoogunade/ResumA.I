// pages/api/resumes/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ResumeService } from "@/lib/database/resumeService";
import { CreateResumeSchema, CreateResumeInput } from "@/lib/validation/schemas";
import { validateRequest, rateLimit } from "@/lib/validation/middleware";
import { StandardApiResponse } from "@/types/resume";

export default async function addResumeHandler(req: NextApiRequest, res: NextApiResponse<StandardApiResponse<{ id: string }>>) {
  // Check HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Apply rate limiting
    const rateLimitResult = await new Promise<boolean>((resolve) => {
      rateLimit(15 * 60 * 1000, 20)(req, res, () => resolve(true));
    }).catch(() => false);

    if (!rateLimitResult) {
      return; // Rate limit response already sent
    }

    // Validate and process request
    validateRequest(CreateResumeSchema)(req, res, async (validatedData: CreateResumeInput) => {
      try {
        // Map frontend field names to backend schema
        const resumeData = {
          jobTitle: validatedData.jobTitle,
          jobLink: validatedData.jobLink || undefined,
          jobDescription: validatedData.jobDescription,
          originalResume: validatedData.originalResume, // Renamed from OGResume
          ...(validatedData.tailoredResume && { tailoredResume: validatedData.tailoredResume }),
        };

        const result = await ResumeService.create(resumeData);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: result.error,
            code: 'CREATION_FAILED'
          });
        }

        return res.status(201).json({
          success: true,
          message: "Resume created successfully!",
          data: { id: result.id.toString() }
        });
      } catch (serviceError) {
        console.error('Service error in add resume:', serviceError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create resume',
          code: 'SERVICE_ERROR'
        });
      }
    });

  } catch (error) {
    console.error('Handler error in add resume:', error);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}