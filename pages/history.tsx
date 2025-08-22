// pages/history.tsx - REVAMPED WITH SIDE-BY-SIDE VIEW
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'

type Resume = {
  _id: string
  name: string
  email: string
  OGResume?: string
  jobDescription?: string   
  tailoredResume?: string
  jobLink?: string
  createdAt?: string
}

type ViewMode = 'collapsed' | 'expanded';

export default function HistoryPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedResumes, setExpandedResumes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed')

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

  const trashResume = async (id: string, name: string) => {
    if (!confirm(`Move "${name}" to trash?`)) return
    
    try {
      const res = await fetch('/api/resumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (!res.ok) throw new Error('Failed to trash resume')
      await fetchResumes()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trash resume')
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedResumes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedResumes(newExpanded)
  }

  const toggleAll = () => {
    if (viewMode === 'collapsed') {
      // Expand all
      const allIds = new Set(resumes.map(r => r._id))
      setExpandedResumes(allIds)
      setViewMode('expanded')
    } else {
      // Collapse all
      setExpandedResumes(new Set())
      setViewMode('collapsed')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return 'No content available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => { fetchResumes() }, [])

  if (loading) return <div className="max-w-2xl mx-auto p-6"><p>Loading history...</p></div>
  if (error) return <div className="max-w-2xl mx-auto p-6 text-red-600"><p>Error: {error}</p></div>

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume History</h1>
            <p className="text-gray-600 mt-2">Your last 5 tailored resumes</p>
          </div>
          {resumes.length > 0 && (
            <button
              onClick={toggleAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {viewMode === 'collapsed' ? '📖 Expand All' : '📘 Collapse All'}
            </button>
          )}
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No resumes yet</h2>
            <p className="text-gray-500 mb-6">Upload your first resume to get started</p>
            <a
              href="/upload"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Upload Resume
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {resumes.map((resume) => {
              const isExpanded = expandedResumes.has(resume._id);
              
              return (
                <div key={resume._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {resume.name || 'Unknown Name'}
                        </h3>
                        <p className="text-gray-600 mb-2">{resume.email || 'No email provided'}</p>
                        {resume.createdAt && (
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(resume.createdAt)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleExpand(resume._id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2"
                        >
                          <span>{isExpanded ? '▲' : '▼'}</span>
                          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                        
                        <button
                          onClick={() => trashResume(resume._id, resume.name || 'Unknown')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-2"
                          title="Move to trash"
                        >
                          <span>🗑️</span>
                          <span>Trash</span>
                        </button>
                      </div>
                    </div>

                    {resume.jobLink && (
                      <div className="mt-4">
                        <strong className="text-gray-700">Job Posting: </strong>
                        <a 
                          href={resume.jobLink} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-words"
                        >
                          {resume.jobLink}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Resume */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                              Original Resume
                            </h4>
                            <span className="text-sm text-gray-500">
                              {resume.OGResume?.length || 0} characters
                            </span>
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
                            {resume.OGResume || 'No original resume content available'}
                          </div>
                        </div>

                        {/* Tailored Resume */}
                        <div className="bg-white rounded-lg border border-green-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-green-900 flex items-center">
                              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                              AI-Tailored Version
                            </h4>
                            <span className="text-sm text-green-600">
                              {resume.tailoredResume?.length || 0} characters
                            </span>
                          </div>
                          {resume.tailoredResume ? (
                            <div className="text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm border border-green-100">
                              {resume.tailoredResume}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg">
                              No tailored version available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Job Description (if available) */}
                      {resume.jobDescription && (
                        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                            Job Description
                          </h4>
                          <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto text-sm">
                            {resume.jobDescription}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsed Preview */}
                  {!isExpanded && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Original Resume</h4>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {truncateText(resume.OGResume, 200)}
                          </div>
                        </div>

                        {resume.tailoredResume && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-medium text-green-700 mb-2">Tailored Version</h4>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {truncateText(resume.tailoredResume, 200)}
                            </div>
                          </div>
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
    </>
  )
}