// pages/upload.tsx - UPDATED VERSION
import { useState, useRef, ChangeEvent } from 'react';
import Navbar from '../components/navbar';
import FileUploader from '../components/FileUploader'; // We'll create this
import "../app/globals.css";
import { validateFile } from '@/lib/fileParser';

export default function UploadPage() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    summary: '',
    jobLink: '',
    jobDescription: '' 
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [wordCount, setWordCount] = useState(0);
  const [tailoredResume, setTailoredResume] = useState('');
  const [showTailoredResume, setShowTailoredResume] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'jobDescription') {
      setWordCount(value.trim() ? value.trim().split(/\s+/).length : 0);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    
    try {
      const response = await fetch('/api/resumes/parse-file', {
        method: 'POST',
        body: createFormData(file),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file');
      }

      if (data.success) {
        setForm(prev => ({ ...prev, summary: data.text }));
        setMessage('✅ File parsed successfully!');
      } else {
        throw new Error(data.error || 'Failed to process file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setUploadError(`❌ ${errorMessage}`);
      setMessage('');
    }
  };

  const createFormData = (file: File): FormData => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  };

  const handleTailorResume = async () => {
    if (!form.summary.trim() || !form.jobDescription.trim()) {
      setMessage('❌ Please provide both resume content and job description');
      return;
    }

    setIsTailoring(true);
    setMessage('');

    try {
      const response = await fetch('/api/resumes/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: form.summary,
          jobDescription: form.jobDescription,
          jobLink: form.jobLink
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTailoredResume(data.tailoredResume);
        setShowTailoredResume(true);
        setMessage('✅ Resume tailored successfully!');
      } else {
        throw new Error(data.error || 'Failed to tailor resume');
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to tailor resume'}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.email.trim() || !form.summary.trim()) {
      setMessage('❌ Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Save to database
      const addRes = await fetch('/api/resumes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          summary: form.summary,
          jobLink: form.jobLink,
          jobDescription: form.jobDescription
        }),
      });

      if (!addRes.ok) {
        const errorData = await addRes.json();
        throw new Error(errorData.error || 'Failed to save resume');
      }

      let tailoredMessage = '';
      
      // If job description provided, get AI tailoring
      if (form.jobDescription.trim()) {
        try {
          const tailorRes = await fetch('/api/resumes/tailor-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resumeText: form.summary,
              jobDescription: form.jobDescription,
              jobLink: form.jobLink
            }),
          });

          if (tailorRes.ok) {
            const tailorData = await tailorRes.json();
            tailoredMessage = ' AI tailoring completed!';
            
            // Update with tailored version
            const addData = await addRes.json();
            await fetch('/api/resumes/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: addData.id,
                tailoredResume: tailorData.tailoredResume
              }),
            });

            setTailoredResume(tailorData.tailoredResume);
            setShowTailoredResume(true);
          }
        } catch (tailorError) {
          console.warn('AI tailoring failed, but resume was saved:', tailorError);
        }
      }
      
      setMessage(`✅ Resume saved successfully!${tailoredMessage}`);
      // Reset form but keep job info for potential new uploads
      setForm({ 
        name: '', 
        email: '', 
        summary: '', 
        jobLink: form.jobLink, // Keep job link
        jobDescription: form.jobDescription // Keep job description
      });
      setWordCount(0);
      
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Error saving resume'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tailoredResume);
      setMessage('✅ Copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Failed to copy');
    }
  };

  const downloadTailoredResume = () => {
    const element = document.createElement('a');
    const file = new Blob([tailoredResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${form.name || 'tailored'}_resume_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isFormValid = form.name.trim() && form.email.trim() && form.summary.trim();
  const canTailor = form.summary.trim() && form.jobDescription.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section - Keep your existing beautiful hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 shadow-2xl">
          {/* ... your existing hero content ... */}
        </div>

        {/* Main Form */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white/50 dark:bg-gray-800/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/30 dark:hover:bg-gray-800/30'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">📁</span>
                Upload File
              </span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                activeTab === 'paste'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white/50 dark:bg-gray-800/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/30 dark:hover:bg-gray-800/30'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">✏️</span>
                Paste Text
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Resume Upload Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-3xl">📄</span>
                Your Resume
              </h2>
              
              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  <FileUploader
                    onFileSelect={handleFileUpload}
                    onError={setUploadError}
                  />
                  {uploadError && (
                    <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {uploadError}
                    </div>
                  )}
                  {form.summary && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        ✅ File uploaded successfully! ({form.summary.length} characters)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    name="summary"
                    rows={10}
                    value={form.summary}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder="Paste your resume text here... Include your skills, experience, education, and achievements."
                  />
                  <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300">
                    {form.summary.length} characters
                  </div>
                </div>
              )}
            </div>

            {/* Job Information Section - Keep your existing beautiful design */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  Job Information
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Optional)</span>
                </h2>
                
                {canTailor && (
                  <button
                    type="button"
                    onClick={handleTailorResume}
                    disabled={isTailoring}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                      isTailoring
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {isTailoring ? '⏳ Tailoring...' : '🤖 Preview AI Tailoring'}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    name="jobLink"
                    value={form.jobLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="https://company.com/careers/job-posting"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    Job Description
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                      {wordCount} words
                    </span>
                  </label>
                  <textarea
                    name="jobDescription"
                    rows={6}
                    value={form.jobDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder="Paste the job description here for AI-powered resume tailoring..."
                  />
                </div>
              </div>
            </div>

            {/* Personal Information - Keep your existing design */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-3xl">👤</span>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - Keep your existing design */}
            <div className="flex flex-col items-center space-y-4 pt-6">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full max-w-md px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '⏳ Processing...' : '🚀 Generate AI-Tailored Resume'}
              </button>
            </div>
          </form>
        </div>

        {/* Tailored Resume Display */}
        {showTailoredResume && tailoredResume && (
          <div className="mt-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">✨</span>
                  AI-Tailored Resume
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={downloadTailoredResume}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => setShowTailoredResume(false)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                  {tailoredResume}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-semibold ${
            message.includes('✅') 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}