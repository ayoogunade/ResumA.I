// types/resume.ts
import { ObjectId } from 'mongodb';

export interface Resume {
  _id: string;
  jobTitle: string;
  jobLink?: string;
  jobDescription: string;
  originalResume: string; // Renamed from OGResume for clarity
  tailoredResume?: string;
  userId?: string;
  trashed: boolean;
  trashedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Analytics fields
  viewCount?: number;
  downloadCount?: number;
  lastAccessed?: Date;
  
  // AI metadata
  aiModel?: string;
  processingTime?: number;
  matchScore?: number;
}

export interface CreateResumeRequest {
  jobTitle: string;
  jobLink?: string;
  jobDescription: string;
  originalResume: string;
}

export interface UpdateResumeRequest {
  jobTitle?: string;
  jobLink?: string;
  jobDescription?: string;
  originalResume?: string;
  tailoredResume?: string;
}

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface ResumeApiResponse extends StandardApiResponse<Resume | Resume[]> {
  resumes?: Resume[];
  resume?: Resume;
}

export interface FileUploadResponse extends StandardApiResponse<string> {
  text?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}