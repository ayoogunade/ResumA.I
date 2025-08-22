// pages/upload.tsx - COMPLETE UPDATED VERSION
import { useState, useRef, ChangeEvent } from 'react';
import Navbar from '../components/navbar';
import FileUploader from '../components/FileUploader';
import "../app/globals.css";

export default function UploadPage() {
  const [form, setForm] = useState({ 
    jobTitle: '',
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
  const [resumeContent, setResumeContent] = useState('');

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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resumes/parse-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to parse file');
      
      if (data.success) {
        setResumeContent(data.text);
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

  const handleTailorResume = async () => {
    if (!resumeContent.trim() || !form.jobDescription.trim()) {
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
          resumeText: resumeContent,
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
    
    if (!resumeContent.trim()) {
      setMessage('❌ Please upload or paste a resume first');
      return;
    }

    if (!form.jobTitle.trim() || !form.jobDescription.trim()) {
      setMessage('❌ Job title and description are required');
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
          jobTitle: form.jobTitle,
          jobLink: form.jobLink,
          jobDescription: form.jobDescription,
          OGResume: resumeContent,
        }),
      });

      if (!addRes.ok) {
        const errorData = await addRes.json();
        throw new Error(errorData.error || 'Failed to save resume');
      }

      // Get AI tailoring
      const tailorRes = await fetch('/api/resumes/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescription: form.jobDescription,
          jobLink: form.jobLink
        }),
      });

      if (tailorRes.ok) {
        const tailorData = await tailorRes.json();
        setTailoredResume(tailorData.tailoredResume);
        setShowTailoredResume(true);
        
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
      }
      
      setMessage('✅ Resume tailored and saved successfully!');
      // Reset form
      setForm({ 
        jobTitle: '',
        jobLink: '',
        jobDescription: '' 
      });
      setResumeContent('');
      setWordCount(0);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing resume';
      setMessage(`❌ ${errorMessage}`);
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
    element.download = `${form.jobTitle || 'tailored'}_resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const canTailor = resumeContent.trim() && form.jobDescription.trim();
  const isFormValid = form.jobTitle.trim() && form.jobDescription.trim() && resumeContent.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center">
            <div className="lg:w-2/3 text-white mb-6 lg:mb-0">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                Transform Your Resume with{' '}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  AI Magic
                </span>
              </h1>
              <p className="text-xl lg:text-2xl mb-6 opacity-90 leading-relaxed">
                Upload your resume and let our AI tailor it perfectly for your dream job in seconds.
              </p>
              <div className="flex flex-wrap gap-4 text-sm lg:text-base">
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="mr-2">⚡</span>
                  <span>Instant AI Analysis</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="mr-2">🎯</span>
                  <span>Job-Specific Tailoring</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="mr-2">📈</span>
                  <span>Higher Success Rate</span>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative text-6xl lg:text-8xl animate-bounce">
                  🚀
                </div>
              </div>
            </div>
          </div>
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
                  {resumeContent && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        ✅ Resume ready for tailoring! ({resumeContent.length} characters)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    name="resumeContent"
                    rows={10}
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder="Paste your resume text here... Include your skills, experience, education, and achievements."
                  />
                  <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300">
                    {resumeContent.length} characters
                  </div>
                </div>
              )}
            </div>

            {/* Job Information Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  Job Information
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
                    {isTailoring ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Tailoring...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>🤖</span>
                        Preview AI Tailoring
                      </span>
                    )}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="e.g., Software Engineer, Marketing Manager"
                  />
                </div>
                
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
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 items-center justify-between">
                  Job Description *
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                    {wordCount} words
                  </span>
                </label>
                <textarea
                  name="jobDescription"
                  rows={6}
                  value={form.jobDescription}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  placeholder="Paste the job description here for AI-powered resume tailoring..."
                />
              </div>
            </div>

            {/* Submit Button */}
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
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing Your Resume...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Generate AI-Tailored Resume
                  </span>
                )}
              </button>
              
              {!isFormValid && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Please fill in all required fields: job title, job description, and resume content
                </p>
              )}
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
                  AI-Tailored Resume for {form.jobTitle}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span>📋</span>
                    Copy
                  </button>
                  <button
                    onClick={downloadTailoredResume}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span>⬇️</span>
                    Download
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
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}