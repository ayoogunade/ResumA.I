// pages/history.tsx - COMPLETE UPDATED VERSION WITH EDIT FUNCTIONALITY
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import "../app/globals.css";


type Resume = {
  _id: string
  jobTitle?: string
  jobLink?: string
  jobDescription?: string   
  OGResume?: string
  tailoredResume?: string
  createdAt?: string
}

type ExpandedSections = {
  jobDescription: 'hidden' | 'preview' | 'full'
  originalResume: boolean
  tailoredResume: boolean
}

type EditModalState = {
  isOpen: boolean
  resumeId: string | null
  jobLink: string
  jobTitle: string
}

export default function HistoryPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, ExpandedSections>>({})
  const [compareMode, setCompareMode] = useState<string | null>(null) // ID of resume in compare mode
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    resumeId: null,
    jobLink: '',
    jobTitle: ''
  })

  const fetchResumes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/resumes/history')
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      console.log('History API response:', data)
      setResumes(data.data?.resumes || data.resumes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const trashResume = async (id: string, jobTitle: string) => {
    console.log('Attempting to trash resume with ID:', id, 'Title:', jobTitle);
    if (!confirm(`Move "${jobTitle}" to trash?`)) return
    
    try {
      console.log('Making API call to trash resume with ID:', id);
      const res = await fetch('/api/resumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      console.log('Trash API response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Trash API error response:', errorData);
        throw new Error(errorData.message || 'Failed to trash resume');
      }
      
      const data = await res.json();
      console.log('Trash success response:', data);
      
      await fetchResumes()
      setExpandedId(null)
    } catch (err) {
      console.error('Trash error:', err);
      alert(err instanceof Error ? err.message : 'Failed to trash resume')
    }
  }

  const updateJobLink = async (resumeId: string, newJobLink: string, newJobTitle: string) => {
    try {
      const res = await fetch('/api/resumes/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resumeId,
          jobLink: newJobLink,
          jobTitle: newJobTitle
        }),
      })

      if (!res.ok) throw new Error('Failed to update job details')
      
      // Update local state optimistically
      setResumes(prev => prev.map(resume => 
        resume._id === resumeId 
          ? { ...resume, jobLink: newJobLink, jobTitle: newJobTitle }
          : resume
      ))
      
      setEditModal({ isOpen: false, resumeId: null, jobLink: '', jobTitle: '' })
      alert('Job details updated successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update job details')
    }
  }

  const openEditModal = (resume: Resume) => {
    setEditModal({
      isOpen: true,
      resumeId: resume._id,
      jobLink: resume.jobLink || '',
      jobTitle: resume.jobTitle || ''
    })
  }

  const closeEditModal = () => {
    setEditModal({ isOpen: false, resumeId: null, jobLink: '', jobTitle: '' })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    if (expandedId !== id && !expandedSections[id]) {
      setExpandedSections(prev => ({
        ...prev,
        [id]: { jobDescription: 'hidden', originalResume: false, tailoredResume: false }
      }))
    }
  }

  const toggleSection = (resumeId: string, section: keyof ExpandedSections) => {
    setExpandedSections(prev => {
      const current = prev[resumeId] || { jobDescription: 'hidden', originalResume: false, tailoredResume: false }
      
      if (section === 'jobDescription') {
        const currentState = current.jobDescription
        let nextState: 'hidden' | 'preview' | 'full'
        
        if (currentState === 'hidden') nextState = 'preview'
        else if (currentState === 'preview') nextState = 'full'  
        else nextState = 'hidden'
        
        return {
          ...prev,
          [resumeId]: {
            ...current,
            jobDescription: nextState
          }
        }
      }
      
      return {
        ...prev,
        [resumeId]: {
          ...current,
          [section]: !current[section]
        }
      }
    })
  }

  const toggleCompareMode = (resumeId: string) => {
    setCompareMode(compareMode === resumeId ? null : resumeId)
  }

  const expandAllSections = (resumeId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [resumeId]: { jobDescription: 'full', originalResume: true, tailoredResume: true }
    }))
  }

  const collapseAllSections = (resumeId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [resumeId]: { jobDescription: 'hidden', originalResume: false, tailoredResume: false }
    }))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => { fetchResumes() }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 text-red-600">
        <p>Error: {error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Job Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editModal.jobTitle}
                  onChange={(e) => setEditModal(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter job title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Link
                </label>
                <input
                  type="url"
                  value={editModal.jobLink}
                  onChange={(e) => setEditModal(prev => ({ ...prev, jobLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/job-posting"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateJobLink(editModal.resumeId!, editModal.jobLink, editModal.jobTitle)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`mx-auto p-6 transition-all duration-300 ${compareMode ? 'max-w-7xl' : 'max-w-4xl'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume History</h1>
            <p className="text-gray-600 text-sm">Your recently tailored resumes</p>
          </div>
          {resumes.length > 0 && (
            <span className="text-sm text-gray-500">
              {resumes.length} {resumes.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No resumes yet</h2>
            <p className="text-gray-500 mb-6">Get started by tailoring your first resume</p>
            <a
              href="/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Resume
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => {
              const isExpanded = expandedId === resume._id;
              const sections = expandedSections[resume._id] || { 
                jobDescription: 'hidden', 
                originalResume: false, 
                tailoredResume: false 
              };
              const isInCompareMode = compareMode === resume._id;

              return (
                <div key={resume._id} className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
                  isExpanded ? 'border-indigo-200 shadow-md' : 'border-gray-200'
                } ${isInCompareMode ? 'ring-2 ring-blue-500' : ''} overflow-hidden`}>
                  {/* Enhanced Header */}
                  <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150" onClick={() => toggleExpand(resume._id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-sm">📄</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">
                              {resume.jobTitle || 'Untitled Job'}
                            </h3>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <span>📅</span>
                                {formatDate(resume.createdAt)}
                              </span>
                              {resume.createdAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="flex items-center gap-1">
                                    <span>⏰</span>
                                    {formatTime(resume.createdAt)}
                                  </span>
                                </>
                              )}
                              {resume.tailoredResume && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <span className="mr-1">✨</span>
                                    AI-Tailored
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {resume.tailoredResume && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompareMode(resume._id);
                            }}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              isInCompareMode 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200'
                            }`}
                            title="Toggle compare mode"
                          >
                            {isInCompareMode ? '📊 Exit Compare' : '🔄 Compare'}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trashResume(resume._id, resume.jobTitle || 'Untitled Job');
                          }}
                          className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                          title="Move to trash"
                        >
                          <span>🗑️</span>
                          Move to Trash
                        </button>
                        <span className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Enhanced Section Controls */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚙️</span>
                            <h4 className="font-semibold text-gray-800">Content Sections</h4>
                          </div>
                          <div className="flex space-x-3">
                            {isInCompareMode && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="mr-1">📊</span>
                                Compare Mode Active
                              </span>
                            )}
                            <button
                              onClick={() => expandAllSections(resume._id)}
                              className="px-4 py-2 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors font-medium"
                            >
                              📖 Expand All
                            </button>
                            <button
                              onClick={() => collapseAllSections(resume._id)}
                              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors font-medium"
                            >
                              📋 Collapse All
                            </button>
                          </div>
                        </div>
                      </div>
                      
                        {/* Enhanced Job Link Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🔗</span>
                              <h5 className="font-semibold text-gray-800">Job Posting</h5>
                            </div>
                            <button
                              onClick={() => openEditModal(resume)}
                              className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                            >
                              <span>✏️</span>
                              Edit Details
                            </button>
                          </div>
                          {resume.jobLink ? (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                              <a 
                                href={resume.jobLink} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-900 hover:underline font-medium break-all flex items-center gap-2"
                              >
                                <span>🌐</span>
                                {truncateText(resume.jobLink, 50)}
                                <span className="text-xs">↗️</span>
                              </a>
                            </div>
                          ) : (
                            <div className="text-gray-500 italic bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-center">
                              <span className="text-gray-400">📝</span> No job link added
                            </div>
                          )}
                        </div>

                        {/* Enhanced Job Description Section */}
                        {resume.jobDescription && (
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleSection(resume._id, 'jobDescription')}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📋</span>
                                <h5 className="font-semibold text-gray-800">Job Description</h5>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  sections.jobDescription === 'hidden' 
                                    ? 'bg-gray-100 text-gray-600' 
                                    : sections.jobDescription === 'preview'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {sections.jobDescription === 'hidden' && '🚫 Hidden'}
                                  {sections.jobDescription === 'preview' && '👀 Preview'}
                                  {sections.jobDescription === 'full' && '📄 Full'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {resume.jobDescription.length} chars
                                </span>
                                <span className={`transform transition-transform duration-200 ${
                                  sections.jobDescription === 'hidden' ? '' : 'rotate-180'
                                }`}>
                                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                            
                            {sections.jobDescription !== 'hidden' && (
                              <div className="border-t border-gray-100">
                                <div className={`text-gray-700 whitespace-pre-wrap bg-gradient-to-b from-gray-50 to-white p-5 ${
                                  sections.jobDescription === 'preview' ? 'max-h-32 overflow-hidden' : 'max-h-96 overflow-y-auto'
                                }`}>
                                  {sections.jobDescription === 'preview' 
                                    ? resume.jobDescription.substring(0, 200) + (resume.jobDescription.length > 200 ? '...' : '')
                                    : resume.jobDescription
                                  }
                                </div>
                                {sections.jobDescription === 'preview' && resume.jobDescription.length > 200 && (
                                  <div className="bg-blue-50 px-5 py-3 border-t border-blue-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection(resume._id, 'jobDescription');
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                    >
                                      <span>📖</span>
                                      Click to read full description
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Enhanced Resume Comparison Section */}
                        <div className={`${isInCompareMode ? 'max-w-none' : 'max-w-5xl'}`}>
                          <div className={`grid ${isInCompareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} ${isInCompareMode ? 'gap-8' : 'gap-6'}`}>
                            
                            {/* Original Resume */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                              <div 
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                                onClick={() => toggleSection(resume._id, 'originalResume')}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">📄</span>
                                  <h5 className="font-semibold text-gray-800">Original Resume</h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {resume.OGResume?.length || 0} chars
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const text = resume.OGResume || '';
                                      navigator.clipboard.writeText(text);
                                      alert('Original resume copied to clipboard!');
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    📋
                                  </button>
                                  <span className={`transform transition-transform duration-200 ${sections.originalResume ? 'rotate-180' : ''}`}>
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                </div>
                              </div>
                              
                              {sections.originalResume && (
                                <div className={`text-gray-700 text-sm whitespace-pre-wrap bg-gradient-to-b from-gray-50 to-white p-5 ${
                                  isInCompareMode ? 'max-h-[600px]' : 'max-h-96'
                                } overflow-y-auto`}>
                                  {resume.OGResume || 'No original resume content available'}
                                </div>
                              )}
                              
                              {!sections.originalResume && resume.OGResume && (
                                <div className="p-5">
                                  <div className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                                    <span>📄</span> Click above to view original resume content
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* AI-Tailored Resume */}
                            {resume.tailoredResume && (
                              <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
                                <div 
                                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-green-50 transition-colors border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50"
                                  onClick={() => toggleSection(resume._id, 'tailoredResume')}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">✨</span>
                                    <h5 className="font-semibold text-green-800">AI-Tailored Version</h5>
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                      Enhanced
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                      {resume.tailoredResume.length} chars
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(resume.tailoredResume!);
                                        alert('Tailored resume copied to clipboard!');
                                      }}
                                      className="p-1 text-green-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
                                      title="Copy to clipboard"
                                    >
                                      📋
                                    </button>
                                    <span className={`transform transition-transform duration-200 ${sections.tailoredResume ? 'rotate-180' : ''}`}>
                                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                                
                                {sections.tailoredResume && (
                                  <div className={`text-gray-700 text-sm whitespace-pre-wrap bg-gradient-to-b from-green-50 to-white p-5 ${
                                    isInCompareMode ? 'max-h-[600px]' : 'max-h-96'
                                  } overflow-y-auto border-l-4 border-green-300`}>
                                    {resume.tailoredResume}
                                  </div>
                                )}
                                
                                {!sections.tailoredResume && (
                                  <div className="p-5">
                                    <div className="text-green-600 text-sm bg-green-50 p-4 rounded-lg text-center border border-green-200">
                                      <span>✨</span> Click above to view AI-tailored resume content
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}