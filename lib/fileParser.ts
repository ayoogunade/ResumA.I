// lib/fileParser.ts - CORRECT VERSION (no pdf-parse)
import * as mammoth from 'mammoth';

export const SUPPORTED_FILE_TYPES = {
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TEXT: 'text/plain'
} as const;

export const SUPPORTED_FILE_EXTENSIONS = ['.docx', '.txt'];

export async function parseFile(file: File): Promise<string> {
  try {
    // Validate file type
    if (!Object.values(SUPPORTED_FILE_TYPES).includes(file.type as any) && 
        !SUPPORTED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: DOCX, TXT`);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    if (file.type === SUPPORTED_FILE_TYPES.DOCX || file.name.toLowerCase().endsWith('.docx')) {
      // Convert ArrayBuffer to Buffer for Mammoth
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }
    else if (file.type === SUPPORTED_FILE_TYPES.TEXT || file.name.toLowerCase().endsWith('.txt')) {
      const text = await file.text();
      return cleanText(text);
    }
    
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('Parsing error:', error);
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  const isValidType = Object.values(SUPPORTED_FILE_TYPES).includes(file.type as any) || 
                     SUPPORTED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!isValidType) {
    return { isValid: false, error: `Unsupported file type. Supported: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}` };
  }
  
  return { isValid: true };
}

// Utility function to get file extension
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

// Utility function to check if file is supported by extension
export function isFileSupportedByExtension(filename: string): boolean {
  const extension = getFileExtension(filename);
  return SUPPORTED_FILE_EXTENSIONS.includes('.' + extension);
}