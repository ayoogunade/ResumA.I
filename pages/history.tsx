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
  jobDescription: boolean
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
      setResumes(data.resumes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const trashResume = async (id: string, jobTitle: string) => {
    if (!confirm(`Move "${jobTitle}" to trash?`)) return
    
    try {
      const res = await fetch('/api/resumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (!res.ok) throw new Error('Failed to trash resume')
      await fetchResumes()
      setExpandedId(null)
    } catch (err) {
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
        [id]: { jobDescription: false, originalResume: false, tailoredResume: false }
      }))
    }
  }

  const toggleSection = (resumeId: string, section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [resumeId]: {
        ...prev[resumeId],
        [section]: !prev[resumeId]?.[section]
      }
    }))
  }

  const expandAllSections = (resumeId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [resumeId]: { jobDescription: true, originalResume: true, tailoredResume: true }
    }))
  }

  const collapseAllSections = (resumeId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [resumeId]: { jobDescription: false, originalResume: false, tailoredResume: false }
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

      <div className="max-w-4xl mx-auto p-6">
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
                jobDescription: false, 
                originalResume: false, 
                tailoredResume: false 
              };

              return (
                <div key={resume._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* List Item Header */}
                  <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(resume._id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {resume.jobTitle || 'Untitled Job'}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <span>{formatDate(resume.createdAt)}</span>
                          {resume.createdAt && (
                            <span className="mx-2">•</span>
                          )}
                          <span>{formatTime(resume.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trashResume(resume._id, resume.jobTitle || 'Untitled Job');
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Move to trash"
                        >
                          🗑️
                        </button>
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {/* Section Controls */}
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-700">Content Sections</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => expandAllSections(resume._id)}
                            className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded border border-blue-300 transition-colors"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={() => collapseAllSections(resume._id)}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                          >
                            Collapse All
                          </button>
                        </div>
                      </div>

                      {/* Job Link with Edit Button */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-700 text-sm">Job Posting</h5>
                          <button
                            onClick={() => openEditModal(resume)}
                            className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
                          >
                            <span className="mr-1">✏️</span>
                            Edit
                          </button>
                        </div>
                        {resume.jobLink ? (
                          <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-200">
                            <a 
                              href={resume.jobLink} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
                            >
                              <span className="mr-2">🔗</span>
                              {truncateText(resume.jobLink, 40)}
                            </a>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm italic bg-gray-100 px-3 py-2 rounded border border-gray-200">
                            No job link added
                          </div>
                        )}
                      </div>

                      {/* Job Description Section */}
                      {resume.jobDescription && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 
                              className="font-medium text-gray-700 text-sm cursor-pointer hover:text-gray-900"
                              onClick={() => toggleSection(resume._id, 'jobDescription')}
                            >
                              Job Description {sections.jobDescription ? '▲' : '▼'}
                            </h5>
                            <span className="text-xs text-gray-500">
                              {resume.jobDescription.length} characters
                            </span>
                          </div>
                          <div className={`text-gray-600 text-sm whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 overflow-y-auto ${
                            sections.jobDescription ? 'max-h-96' : 'max-h-32'
                          }`}>
                            {resume.jobDescription}
                            {!sections.jobDescription && resume.jobDescription.length > 200 && (
                              <div className="text-blue-600 text-xs mt-2 cursor-pointer" 
                                   onClick={() => toggleSection(resume._id, 'jobDescription')}>
                                Click to expand full description...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resume Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Resume */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 
                              className="font-medium text-gray-700 text-sm cursor-pointer hover:text-gray-900"
                              onClick={() => toggleSection(resume._id, 'originalResume')}
                            >
                              Original Resume {sections.originalResume ? '▲' : '▼'}
                            </h5>
                            <span className="text-xs text-gray-500">
                              {resume.OGResume?.length || 0} characters
                            </span>
                          </div>
                          <div className={`text-gray-600 text-sm whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 overflow-y-auto ${
                            sections.originalResume ? 'max-h-96' : 'max-h-40'
                          }`}>
                            {resume.OGResume || 'No original resume content available'}
                            {!sections.originalResume && resume.OGResume && resume.OGResume.length > 150 && (
                              <div className="text-blue-600 text-xs mt-2 cursor-pointer" 
                                   onClick={() => toggleSection(resume._id, 'originalResume')}>
                                Click to expand full resume...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tailored Resume */}
                        {resume.tailoredResume && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 
                                className="font-medium text-green-700 text-sm cursor-pointer hover:text-green-900"
                                onClick={() => toggleSection(resume._id, 'tailoredResume')}
                              >
                                AI-Tailored Version {sections.tailoredResume ? '▲' : '▼'}
                              </h5>
                              <span className="text-xs text-green-600">
                                {resume.tailoredResume.length} characters
                              </span>
                            </div>
                            <div className={`text-gray-600 text-sm whitespace-pre-wrap bg-green-50 p-3 rounded border border-green-200 overflow-y-auto ${
                              sections.tailoredResume ? 'max-h-96' : 'max-h-40'
                            }`}>
                              {resume.tailoredResume}
                              {!sections.tailoredResume && resume.tailoredResume.length > 150 && (
                                <div className="text-blue-600 text-xs mt-2 cursor-pointer" 
                                     onClick={() => toggleSection(resume._id, 'tailoredResume')}>
                                  Click to expand full resume...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const text = resume.OGResume || '';
                            navigator.clipboard.writeText(text);
                            alert('Original resume copied to clipboard!');
                          }}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                        >
                          Copy Original
                        </button>
                        {resume.tailoredResume && (
                          <button
                            onClick={() => {
                              const text = resume.tailoredResume || '';
                              navigator.clipboard.writeText(text);
                              alert('Tailored resume copied to clipboard!');
                            }}
                            className="px-3 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-100 rounded border border-green-300 transition-colors"
                          >
                            Copy Tailored
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const text = resume.OGResume || '';
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${resume.jobTitle || 'resume'}_original.txt`;
                            a.click();
                          }}
                          className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded border border-blue-300 transition-colors"
                        >
                          Download Original
                        </button>
                        {resume.tailoredResume && (
                          <button
                            onClick={() => {
                              const text = resume.tailoredResume || '';
                              const blob = new Blob([text], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${resume.jobTitle || 'resume'}_tailored.txt`;
                              a.click();
                            }}
                            className="px-3 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-100 rounded border border-green-300 transition-colors"
                          >
                            Download Tailored
                          </button>
                        )}
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