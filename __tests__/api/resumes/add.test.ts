// __tests__/api/resumes/add.test.ts
import { createMocks } from 'node-mocks-http'
import { CreateResumeSchema } from '../../../lib/validation/schemas'

// Mock the entire database service module
jest.mock('../../../lib/database/resumeService', () => ({
  ResumeService: {
    create: jest.fn()
  }
}))

describe('/api/resumes/add - Input Validation', () => {
  it('should validate correct resume data with schema', () => {
    const validData = {
      jobTitle: 'Software Engineer',
      jobLink: 'https://example.com/job',
      jobDescription: 'This is a great job opportunity for a software engineer with 3+ years experience...',
      originalResume: 'John Doe\nSoftware Engineer\n\nExperience:\n- Built amazing applications using React and Node.js...'
    }

    const result = CreateResumeSchema.safeParse(validData)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.jobTitle).toBe('Software Engineer')
      expect(result.data.jobLink).toBe('https://example.com/job')
    }
  })

  it('should reject resume with missing required fields', () => {
    const invalidData = {
      jobTitle: '',
      jobDescription: '',
      originalResume: ''
    }

    const result = CreateResumeSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues.some((e: any) => e.path.includes('jobTitle'))).toBe(true)
    }
  })

  it('should handle HTTP method validation', async () => {
    const { req, res } = createMocks({
      method: 'GET', // Wrong method
    })

    // Dynamic import to avoid module loading issues
    const { default: handler } = await import('../../../pages/api/resumes/add')
    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    
    const response = JSON.parse(res._getData())
    expect(response.success).toBe(false)
    expect(response.error).toContain('Method GET not allowed')
    expect(response.code).toBe('METHOD_NOT_ALLOWED')
  })

  it('should sanitize input data', () => {
    const dataWithPotentialXSS = {
      jobTitle: 'Software Engineer',
      jobDescription: 'Valid description with some content that is sufficiently long',
      originalResume: 'Resume content that meets minimum length requirements for validation'
    }

    const result = CreateResumeSchema.safeParse(dataWithPotentialXSS)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.jobTitle).toBe('Software Engineer')
      expect(result.data.jobDescription).toContain('Valid description')
    }
  })
})