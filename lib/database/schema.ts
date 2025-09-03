// lib/database/schema.ts - Unified Database Schema
import { ObjectId } from 'mongodb';

export interface ResumeDocument {
  _id?: ObjectId;
  jobTitle: string;
  jobLink?: string;
  jobDescription: string;
  originalResume: string;  // Renamed from OGResume for clarity
  tailoredResume?: string;
  userId?: string;         // For future user authentication
  trashed: boolean;
  trashedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Analytics fields for future use
  viewCount?: number;
  downloadCount?: number;
  lastAccessed?: Date;
  
  // AI-related metadata
  aiModel?: string;        // Track which AI model was used
  processingTime?: number; // Track AI response time
  matchScore?: number;     // AI-generated match score
}

export interface CreateResumeInput {
  jobTitle: string;
  jobLink?: string;
  jobDescription: string;
  originalResume: string;
  userId?: string;
}

export interface UpdateResumeInput {
  jobTitle?: string;
  jobLink?: string;
  jobDescription?: string;
  originalResume?: string;
  tailoredResume?: string;
  userId?: string;
}

// Database collection names
export const Collections = {
  RESUMES: 'resumes',
  USERS: 'users', // For future use
} as const;

// Database indexes to create for performance
export const ResumeIndexes = [
  { key: { createdAt: -1 } },           // Sort by creation date
  { key: { trashed: 1, trashedAt: 1 } }, // Trash queries
  { key: { userId: 1, createdAt: -1 } }, // User-specific queries
  { key: { jobTitle: 'text', jobDescription: 'text' } }, // Text search
] as const;