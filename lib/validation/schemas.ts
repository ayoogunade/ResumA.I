// lib/validation/schemas.ts - Input validation schemas
import { z } from 'zod';

// Resume validation schemas
export const CreateResumeSchema = z.object({
  jobTitle: z.string()
    .min(1, 'Job title is required')
    .max(200, 'Job title must be less than 200 characters')
    .trim(),
  
  jobLink: z.string()
    .url('Invalid URL format')
    .max(500, 'Job link must be less than 500 characters')
    .optional()
    .or(z.literal('')),
    
  jobDescription: z.string()
    .min(10, 'Job description must be at least 10 characters')
    .max(10000, 'Job description must be less than 10,000 characters')
    .trim(),
    
  originalResume: z.string()
    .min(50, 'Resume must be at least 50 characters')
    .max(50000, 'Resume must be less than 50,000 characters')
    .trim(),
    
  tailoredResume: z.string()
    .max(50000, 'Tailored resume must be less than 50,000 characters')
    .trim()
    .optional(),
});

export const UpdateResumeSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format'),
    
  jobTitle: z.string()
    .min(1, 'Job title is required')
    .max(200, 'Job title must be less than 200 characters')
    .trim()
    .optional(),
  
  jobLink: z.string()
    .url('Invalid URL format')
    .max(500, 'Job link must be less than 500 characters')
    .optional()
    .or(z.literal('')),
    
  jobDescription: z.string()
    .min(10, 'Job description must be at least 10 characters')
    .max(10000, 'Job description must be less than 10,000 characters')
    .trim()
    .optional(),
    
  originalResume: z.string()
    .min(50, 'Resume must be at least 50 characters')
    .max(50000, 'Resume must be less than 50,000 characters')
    .trim()
    .optional(),
    
  tailoredResume: z.string()
    .max(50000, 'Tailored resume must be less than 50,000 characters')
    .trim()
    .optional(),
});

// Simplified schema for updating only tailored resume
export const UpdateTailoredResumeSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format'),
    
  tailoredResume: z.string()
    .min(1, 'Tailored resume cannot be empty')
    .max(50000, 'Tailored resume must be less than 50,000 characters')
    .trim(),
});

export const DeleteResumeSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID format'),
});

export const TailorResumeSchema = z.object({
  resumeText: z.string()
    .min(50, 'Resume text must be at least 50 characters')
    .max(50000, 'Resume text must be less than 50,000 characters')
    .trim(),
    
  jobDescription: z.string()
    .min(10, 'Job description must be at least 10 characters')
    .max(10000, 'Job description must be less than 10,000 characters')
    .trim(),
    
  jobLink: z.string()
    .url('Invalid URL format')
    .max(500, 'Job link must be less than 500 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => val === '' ? undefined : val),
});

// File validation schema
export const FileUploadSchema = z.object({
  size: z.number()
    .max(5 * 1024 * 1024, 'File size must be less than 5MB'),
    
  type: z.string()
    .refine(
      (type) => [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/pdf'
      ].includes(type),
      'File type must be DOCX, TXT, or PDF'
    ),
    
  name: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
});

// Query parameter schemas
export const HistoryQuerySchema = z.object({
  limit: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) || 5 : val)
    .refine((n) => n > 0 && n <= 50, 'Limit must be between 1 and 50')
    .default(5),
    
  offset: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val) || 0 : val)
    .refine((n) => n >= 0, 'Offset must be 0 or greater')
    .default(0),
});

export type CreateResumeInput = z.infer<typeof CreateResumeSchema>;
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>;
export type UpdateTailoredResumeInput = z.infer<typeof UpdateTailoredResumeSchema>;
export type DeleteResumeInput = z.infer<typeof DeleteResumeSchema>;
export type TailorResumeInput = z.infer<typeof TailorResumeSchema>;
export type FileUploadInput = z.infer<typeof FileUploadSchema>;
export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;