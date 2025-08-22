// components/FileUploader.tsx
import { useState } from 'react';
import { validateFile } from '@/lib/fileParser';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
}

export default function FileUploader({ onFileSelect, onError }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      onError(validation.error!);
      return;
    }
    onFileSelect(file);
    onError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".docx,.txt"
        onChange={handleInputChange}
      />
      
      <label htmlFor="resume-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">Upload your resume</p>
          <p className="text-sm text-gray-500 mb-4">
            Drag & drop or click to select (PDF, DOCX, TXT)
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Choose File
          </button>
          <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
        </div>
      </label>
    </div>
  );
}