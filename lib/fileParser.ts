// lib/fileParser.ts - Updated with client-side PDF support
import * as mammoth from 'mammoth';

// Dynamically import PDF.js only on client side
let pdfjsLib: any = null;
let isLoading = false;

async function loadPDFJS() {
  if (pdfjsLib || isLoading) return;
  
  isLoading = true;
  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjsLib = pdfjs;
    
    // Use the worker from public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
    console.log('PDF.js loaded successfully');
  } catch (error) {
    console.error('Failed to load PDF.js:', error);
  } finally {
    isLoading = false;
  }
}

// Initialize on client side
if (typeof window !== 'undefined') {
  loadPDFJS();
}

export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TEXT: 'text/plain'
} as const;

export const SUPPORTED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt'];

// Helper function to parse PDF files
async function parsePDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only supported on the client side. Please upload DOCX or TXT files for server-side processing.');
  }
  
  // Ensure PDF.js is loaded
  if (!pdfjsLib && !isLoading) {
    await loadPDFJS();
  }
  
  // Wait for PDF.js to load if it's currently loading
  let retries = 50; // Increase retries
  while ((!pdfjsLib || isLoading) && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries--;
  }
  
  if (!pdfjsLib) {
    throw new Error('PDF.js failed to load. Please try refreshing the page and try again.');
  }
  
  try {
    // Configure document loading without worker
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseFile(file: File): Promise<string> {
  try {
    // Validate file type
    if (!Object.values(SUPPORTED_FILE_TYPES).includes(file.type as any) && 
        !SUPPORTED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT`);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    if (file.type === SUPPORTED_FILE_TYPES.PDF || file.name.toLowerCase().endsWith('.pdf')) {
      // Parse PDF file (client-side only)
      const text = await parsePDF(arrayBuffer);
      return cleanText(text);
    }
    else if (file.type === SUPPORTED_FILE_TYPES.DOCX || file.name.toLowerCase().endsWith('.docx')) {
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

// Server-side compatible parsing function (excludes PDF)
export async function parseFileServerSide(file: File): Promise<string> {
  try {
    // Server-side only supports DOCX and TXT
    const serverSupportedTypes = [SUPPORTED_FILE_TYPES.DOCX, SUPPORTED_FILE_TYPES.TEXT];
    const serverSupportedExtensions = ['.docx', '.txt'];
    
    if (!serverSupportedTypes.includes(file.type as any) && 
        !serverSupportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      throw new Error(`Server-side parsing only supports DOCX and TXT files. Received: ${file.type}`);
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
    
    throw new Error('Unsupported file type for server-side parsing');
  } catch (error) {
    console.error('Server-side parsing error:', error);
    throw new Error(`Failed to parse file on server: ${error instanceof Error ? error.message : 'Unknown error'}`);
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