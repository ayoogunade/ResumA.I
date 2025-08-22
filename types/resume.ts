// types/resume.ts
export interface Resume {
  _id: string;
  name: string;
  OGResume: string;
  jobLink?: string;
  jobDescription?: string;
  tailoredResume?: string;
  trashed?: boolean;
  trashedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResumeApiResponse {
  success: boolean;
  resumes?: Resume[];
  resume?: Resume;
  error?: string;
  message?: string;
}

export interface FileUploadResponse {
  success: boolean;
  text?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}