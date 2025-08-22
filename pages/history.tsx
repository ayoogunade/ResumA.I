// pages/history.tsx
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'

type Resume = {
  _id: string
  name: string
  email: string
  OGResume?: string          // Made optional with ?
  jobDescription?: string   
  tailoredResume?: string
  jobLink?: string
  createdAt?: string
}

export default function HistoryPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await fetchResumes() // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trash resume')
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

  // Safe text truncation function
  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return 'No content available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => { fetchResumes() }, [])

  if (loading) return <div className="max-w-2xl mx-auto p-6"><p>Loading history...</p></div>
  if (error) return <div className="max-w-2xl mx-auto p-6 text-red-600"><p>Error: {error}</p></div>

  return (
    <div className="max-w-4xl mx-auto">
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Resume History (Last 5)</h1>
        
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No resumes submitted yet.</p>
            <a href="/upload" className="text-blue-600 hover:underline mt-2 inline-block">
              Upload your first resume
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {resumes.map((resume) => (
              <div key={resume._id} className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{resume.name || 'Unknown Name'}</h3>
                    <p className="text-gray-600">{resume.email || 'No email provided'}</p>
                    {resume.createdAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {formatDate(resume.createdAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => trashResume(resume._id, resume.name || 'Unknown')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                    title="Move to trash"
                  >
                    🗑️ Trash
                  </button>
                </div>
                
                {resume.jobLink && (
                  <div className="mb-4">
                    <strong className="text-gray-700">Job Posting: </strong>
                    <a 
                      href={resume.jobLink} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-words"
                    >
                      {truncateText(resume.jobLink, 50)}
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Original Resume</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {truncateText(resume.OGResume, 300)}
                    </div>
                  </div>

                  {resume.tailoredResume && (
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <h4 className="font-medium text-green-700 mb-2">Tailored Version</h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {truncateText(resume.tailoredResume, 300)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}