// pages/trash.tsx

import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import { Resume } from '../types/resume'


export default function TrashPage() {
  // These are like boxes to store things:
  const [resumes, setResumes] = useState<Resume[]>([])  // Box for resumes
  const [loading, setLoading] = useState(false)         // Box to remember if we're busy loading
  const [error, setError] = useState('')                // Box for error messages
  const [currentPage, setCurrentPage] = useState(1)     // Box for current page number
  const [itemsPerPage] = useState(5)                    // Box for how many items per page

  // This is like a robot that fetches trashed resumes
  const fetchTrash = async () => {
    setLoading(true)           // Turn on the "I'm busy" light
    setError('')               // Empty the error box
    
    try {
      // Ask the server for trashed resumes (like ordering a pizza)
      const res = await fetch(`/api/resumes/trash?page=${currentPage}&limit=${itemsPerPage}`)
      
      // If the server says "no pizza today"
      if (!res.ok) throw new Error('Oops! Could not get trashed resumes')
      
      // If we get our pizza (data), put it in the box
      const data = await res.json()
      setResumes(data.resumes)
    } catch (err) {
      // If something goes wrong, put the error message in the box
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)  // Turn off the "I'm busy" light
    }
  }

  // This robot restores a resume from the trash
// Replace the restoreResume function in trash.tsx with:
const restoreResume = async (id: string) => {
    try {
      const res = await fetch('/api/resumes/restore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (!res.ok) throw new Error('Failed to restore')
      
      // Refresh trash
      await fetchTrash()
      
      // Send refresh message via BroadcastChannel
      const channel = new BroadcastChannel('resume-updates')
      channel.postMessage('refresh-history')
      channel.close()
      
      alert('Resume restored! It will reappear in History.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed')
    }
  }

  // This robot permanently deletes a resume
  const permanentlyDelete = async (id: string) => {
    // Double-check if we really want to delete
    if (!confirm('Are you SUPER sure? This cannot be undone!')) return
    
    try {
      // Tell the server to delete forever
      const res = await fetch('/api/resumes/deleteForever', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (!res.ok) throw new Error('Oops! Could not delete')
      
      // Refresh our list after deleting
      fetchTrash()
      alert('Resume is gone forever! 🗑️')
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  // This runs when the page loads or when currentPage changes
  useEffect(() => {
    fetchTrash()
  }, [currentPage])

  return (
    <div>
        <Navbar />
        <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Trash Bin</h1>
        
        {/* Show loading spinner if we're waiting */}
        {loading && <p className="text-blue-500">Loading... ⏳</p>}
        
        {/* Show error message if something went wrong */}
        {error && <p className="text-red-500">Error: {error} ❌</p>}
        
        {/* Show message if trash is empty */}
        {!loading && resumes.length === 0 && (
            <p className="text-gray-500">No trashed resumes. Clean trash! 🧹</p>
        )}
        
        {/* Show our list of trashed resumes */}
        {resumes.length > 0 && (
            <>
            <ul className="space-y-4">
                {resumes.map((resume) => (
                <li key={resume._id} className="border p-4 rounded bg-gray-100 shadow">
                    <p><strong>Name:</strong> {resume.name}</p>
                    <p><strong>Email:</strong> {resume.email}</p>
                    <p><strong>Trashed At:</strong> {new Date(resume.trashedAt).toLocaleString()}</p>
                    
                    {/* Action buttons */}
                    <div className="mt-2 flex space-x-2">
                    <button
                        onClick={() => restoreResume(resume._id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                        Restore
                    </button>
                    <button
                        onClick={() => permanentlyDelete(resume._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                        Delete Forever
                    </button>
                    </div>
                </li>
                ))}
            </ul>
            
            {/* Page navigation buttons */}
            <div className="mt-4 flex justify-between">
                <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                >
                Previous Page
                </button>
                <span>Page {currentPage}</span>
                <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={resumes.length < itemsPerPage}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                >
                Next Page
                </button>
            </div>
            </>
        )}
        </div>
    </div>
  )
}