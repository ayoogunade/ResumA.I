// __tests__/components/FileUploader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUploader from '../../components/FileUploader'

// Mock the file parser validation
jest.mock('../../lib/fileParser', () => ({
  validateFile: jest.fn()
}))

import { validateFile } from '../../lib/fileParser'
const mockValidateFile = validateFile as jest.MockedFunction<typeof validateFile>

describe('FileUploader Component', () => {
  const mockOnFileSelect = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateFile.mockReturnValue({ isValid: true })
  })

  it('renders upload interface correctly', () => {
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    expect(screen.getByText('Upload your resume')).toBeInTheDocument()
    expect(screen.getByText('Drag & drop or click to select (PDF, DOCX, TXT)')).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
    expect(screen.getByText('Max file size: 5MB')).toBeInTheDocument()
  })

  it('accepts valid file through file input', async () => {
    const user = userEvent.setup()
    
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    const file = new File(['resume content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const fileInput = document.getElementById('resume-upload') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledWith(file)
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
      expect(mockOnError).toHaveBeenCalledWith('')
    })
  })

  it('handles file validation errors', async () => {
    const user = userEvent.setup()
    
    // Mock validation failure
    mockValidateFile.mockReturnValue({
      isValid: false,
      error: 'File size must be less than 5MB'
    })

    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    const file = new File(['large file content'], 'large-resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const fileInput = document.getElementById('resume-upload') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledWith(file)
      expect(mockOnFileSelect).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith('File size must be less than 5MB')
    })
  })

  it('supports drag and drop functionality', async () => {
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    // Get the actual drop zone (the div with the drag styling)
    const dropZone = document.querySelector('.border-2.border-dashed')
    expect(dropZone).toBeInTheDocument()

    const file = new File(['resume content'], 'resume.txt', { type: 'text/plain' })

    // Test drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    })

    // Verify visual feedback for drag over
    expect(dropZone).toHaveClass('border-blue-400', 'bg-blue-50')

    // Test drag leave
    fireEvent.dragLeave(dropZone!)
    expect(dropZone).not.toHaveClass('border-blue-400', 'bg-blue-50')

    // Test drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledWith(file)
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('handles multiple files by selecting only the first one', async () => {
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    const file1 = new File(['resume 1'], 'resume1.txt', { type: 'text/plain' })
    const file2 = new File(['resume 2'], 'resume2.txt', { type: 'text/plain' })

    const dropZone = document.querySelector('.border-2.border-dashed')

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file1, file2],
      },
    })

    await waitFor(() => {
      expect(mockValidateFile).toHaveBeenCalledTimes(1)
      expect(mockValidateFile).toHaveBeenCalledWith(file1)
      expect(mockOnFileSelect).toHaveBeenCalledWith(file1)
    })
  })

  it('shows correct file type restrictions', () => {
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    const fileInput = document.getElementById('resume-upload') as HTMLInputElement
    expect(fileInput.accept).toBe('.pdf,.docx,.txt')
  })

  it('prevents default drag behavior', () => {
    render(
      <FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />
    )

    const dropZone = document.querySelector('.border-2.border-dashed')
    
    const dragOverEvent = new Event('dragover', { bubbles: true })
    const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault')
    
    fireEvent(dropZone!, dragOverEvent)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})