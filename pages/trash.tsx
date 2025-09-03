// pages/trash.tsx - FIXED VERSION
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import { Resume } from '../types/resume'
import "../app/globals.css";

export default function TrashPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const fetchTrash = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/resumes/trash?page=${currentPage}&limit=${itemsPerPage}`)
      if (!res.ok) throw new Error('Failed to fetch trashed resumes')
      
      const data = await res.json()
      setResumes(data.resumes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash')
    } finally {
      setLoading(false)
    }
  }

  const restoreResume = async (id: string) => {
    try {
      const res = await fetch('/api/resumes/restore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (!res.ok) throw new Error('Failed to restore resume')
      
      // Refresh trash
      await fetchTrash()
      
      // Send refresh message via BroadcastChannel
      const channel = new BroadcastChannel('resume-updates')
      channel.postMessage('refresh-history')
      channel.close()
      
      alert('Resume restored! It will reappear in History.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore resume')
    }
  }

  const permanentlyDelete = async (id: string) => {
    console.log('Attempting to permanently delete resume with ID:', id);
    if (!confirm('Are you sure? This action cannot be undone!')) return
    
    try {
      console.log('Making API call to deleteForever with ID:', id);
      const res = await fetch('/api/resumes/deleteForever', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      console.log('API response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.message || 'Failed to delete permanently');
      }
      
      const data = await res.json();
      console.log('Delete success response:', data);
      
      fetchTrash()
      alert('Resume permanently deleted!')
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete resume')
    }
  }

  // Format date safely
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    fetchTrash()
  }, [currentPage])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trash Bin</h1>
            <p className="text-gray-600 text-sm">Restore or permanently delete resumes</p>
          </div>
          {resumes.length > 0 && (
            <span className="text-sm text-gray-500">
              Page {currentPage}
            </span>
          )}
        </div>

        {loading && (
          <div className="animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {!loading && resumes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Trash is empty</h2>
            <p className="text-gray-500">No resumes in the trash bin</p>
          </div>
        )}

        {resumes.length > 0 && (
          <>
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div key={resume._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {resume.jobTitle || 'Untitled Job'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Trashed: {formatDate(resume.trashedAt)}
                      </p>
                      {resume.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {formatDate(resume.createdAt)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => restoreResume(resume._id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        title="Restore to history"
                      >
                        ↶ Restore
                      </button>
                      <button
                        onClick={() => permanentlyDelete(resume._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        title="Delete permanently"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                ← Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={resumes.length < itemsPerPage}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}