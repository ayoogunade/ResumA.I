// __tests__/lib/validation/schemas.test.ts
import { 
  CreateResumeSchema, 
  UpdateResumeSchema, 
  TailorResumeSchema,
  FileUploadSchema 
} from '../../../lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('CreateResumeSchema', () => {
    it('should validate correct resume data', () => {
      const validData = {
        jobTitle: 'Software Engineer',
        jobLink: 'https://example.com/job',
        jobDescription: 'This is a great job opportunity for a software engineer...',
        originalResume: 'John Doe\nSoftware Engineer\n\nExperience:\n- Built amazing applications...'
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

    it('should reject resume with invalid job link', () => {
      const invalidData = {
        jobTitle: 'Software Engineer',
        jobLink: 'not-a-valid-url',
        jobDescription: 'This is a great job opportunity...',
        originalResume: 'John Doe resume content...'
      }

      const result = CreateResumeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some((e: any) => 
          e.path.includes('jobLink') && e.message.includes('Invalid URL')
        )).toBe(true)
      }
    })

    it('should allow empty job link', () => {
      const validData = {
        jobTitle: 'Software Engineer',
        jobLink: '',
        jobDescription: 'This is a great job opportunity for a software engineer with experience...',
        originalResume: 'John Doe resume content with sufficient length to meet requirements...'
      }

      const result = CreateResumeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow undefined job link', () => {
      const validData = {
        jobTitle: 'Software Engineer',
        jobDescription: 'This is a great job opportunity for a software engineer with experience...',
        originalResume: 'John Doe resume content with sufficient length to meet requirements...'
      }

      const result = CreateResumeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should enforce character limits', () => {
      const invalidData = {
        jobTitle: 'A'.repeat(201), // Exceeds 200 character limit
        jobDescription: 'Valid description',
        originalResume: 'Valid resume content'
      }

      const result = CreateResumeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some((e: any) => 
          e.path.includes('jobTitle') && e.message.includes('200 characters')
        )).toBe(true)
      }
    })
  })

  describe('TailorResumeSchema', () => {
    it('should validate correct tailoring data', () => {
      const validData = {
        resumeText: 'Valid resume text with enough content to meet minimum requirements',
        jobDescription: 'Valid job description with sufficient detail',
        jobLink: 'https://example.com/job'
      }

      const result = TailorResumeSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short resume text', () => {
      const invalidData = {
        resumeText: 'Too short', // Less than 50 characters
        jobDescription: 'Valid job description with sufficient detail'
      }

      const result = TailorResumeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some((e: any) => 
          e.path.includes('resumeText') && e.message.includes('50 characters')
        )).toBe(true)
      }
    })
  })

  describe('FileUploadSchema', () => {
    it('should validate supported file types', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: 'resume.docx'
      }

      const result = FileUploadSchema.safeParse(validFile)
      expect(result.success).toBe(true)
    })

    it('should reject large files', () => {
      const largeFile = {
        size: 10 * 1024 * 1024, // 10MB (exceeds 5MB limit)
        type: 'text/plain',
        name: 'large-file.txt'
      }

      const result = FileUploadSchema.safeParse(largeFile)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some((e: any) => 
          e.message.includes('5MB')
        )).toBe(true)
      }
    })

    it('should reject unsupported file types', () => {
      const unsupportedFile = {
        size: 1024,
        type: 'image/jpeg', // Not supported
        name: 'image.jpg'
      }

      const result = FileUploadSchema.safeParse(unsupportedFile)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some((e: any) => 
          e.message.includes('DOCX, TXT, or PDF')
        )).toBe(true)
      }
    })
  })
})