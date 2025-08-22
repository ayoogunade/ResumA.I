// pages/api/resumes/parse-file.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { parseFile, validateFile } from '@/lib/fileParser';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  let tempFilePath: string | null = null;

  try {
    const { files } = await new Promise<{ files: any }>((resolve, reject) => {
      form.parse(req, (err, _, files) => {
        if (err) {
          if (err.code === 1009) { // formidable file size error code
            reject(new Error('File too large. Maximum size is 5MB'));
          } else {
            reject(err);
          }
        }
        resolve({ files });
      });
    });

    if (!files?.file?.[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.file[0];
    tempFilePath = file.filepath; // Store for cleanup
    
    // Create File object for validation
    const fileData = fs.readFileSync(file.filepath);
    const tempFile = new File([fileData], file.originalFilename || 'upload', {
      type: file.mimetype || 'application/octet-stream',
    });

    // Validate file before parsing
    const validation = validateFile(tempFile);
    if (!validation.isValid) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: validation.error });
    }

    const textContent = await parseFile(tempFile);
    fs.unlinkSync(file.filepath);

    return res.status(200).json({ 
      success: true,
      text: textContent,
      fileName: file.originalFilename,
      fileSize: file.size,
      fileType: file.mimetype
    });
  } catch (error) {
    console.error('File processing error:', error);
    
    // Clean up temp file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    return res.status(500).json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}