// __tests__/api/resumes/update.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/resumes/update';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock the database service
jest.mock('../../../lib/database/resumeService', () => ({
  ResumeService: {
    update: jest.fn()
  }
}));

// Mock the MongoDB connection
jest.mock('../../../lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn()
      })
    })
  })
}));

import { ResumeService } from '../../../lib/database/resumeService';

describe('/api/resumes/update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Method validation', () => {
    it('should return 405 for non-PATCH requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { id: '507f1f77bcf86cd799439011', tailoredResume: 'Updated resume content' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('Validation schema selection', () => {
    it('should use UpdateTailoredResumeSchema for tailored resume only updates', async () => {
      const mockUpdate = jest.mocked(ResumeService.update);
      mockUpdate.mockResolvedValue({
        success: true,
        resume: {
          _id: '507f1f77bcf86cd799439011',
          tailoredResume: 'Updated tailored resume content',
          jobTitle: 'Software Engineer',
          jobDescription: 'Job description',
          originalResume: 'Original resume',
          trashed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          viewCount: 0,
          downloadCount: 0
        } as any
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          tailoredResume: 'Updated tailored resume content that meets minimum length requirements for validation'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.updated).toBe(true);
      
      expect(mockUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        tailoredResume: 'Updated tailored resume content that meets minimum length requirements for validation'
      });
    });

    it('should use UpdateResumeSchema for general updates', async () => {
      const mockUpdate = jest.mocked(ResumeService.update);
      mockUpdate.mockResolvedValue({
        success: true,
        resume: {
          _id: '507f1f77bcf86cd799439011',
          jobTitle: 'Senior Software Engineer',
          jobLink: 'https://example.com/new-job',
          jobDescription: 'Job description',
          originalResume: 'Original resume',
          trashed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          viewCount: 0,
          downloadCount: 0
        } as any
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          jobTitle: 'Senior Software Engineer',
          jobLink: 'https://example.com/new-job'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.updated).toBe(true);
      
      expect(mockUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        jobTitle: 'Senior Software Engineer',
        jobLink: 'https://example.com/new-job'
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for empty update request (only id)', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('EMPTY_UPDATE_REQUEST');
      expect(data.error).toBe('No fields provided to update');
    });

    it('should return 400 for invalid MongoDB ObjectId', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: 'invalid-id',
          tailoredResume: 'Updated resume content that meets minimum length requirements'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
      expect(data.details[0].path).toBe('id');
      expect(data.details[0].message).toContain('Invalid resume ID format');
    });

    it('should return 400 for empty tailored resume', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          tailoredResume: ''
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details[0].path).toBe('tailoredResume');
      expect(data.details[0].message).toContain('cannot be empty');
    });

    it('should return 400 for invalid job link URL', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          jobLink: 'not-a-valid-url'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details[0].path).toBe('jobLink');
      expect(data.details[0].message).toContain('Invalid URL format');
    });
  });

  describe('Database errors', () => {
    it('should return 400 when resume not found', async () => {
      const mockUpdate = jest.mocked(ResumeService.update);
      mockUpdate.mockResolvedValue({
        success: false,
        error: 'Resume not found'
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          tailoredResume: 'Updated resume content that meets minimum length requirements'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Resume not found');
      expect(data.code).toBe('UPDATE_FAILED');
    });

    it('should return 500 when database service throws error', async () => {
      const mockUpdate = jest.mocked(ResumeService.update);
      mockUpdate.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: {
          id: '507f1f77bcf86cd799439011',
          tailoredResume: 'Updated resume content that meets minimum length requirements'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.code).toBe('SERVICE_ERROR');
    });
  });
});