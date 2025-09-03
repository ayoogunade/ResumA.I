// pages/api/resumes/trash.ts

import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

type TrashResponse = {
  resumes: Array<{
    _id: string
    jobTitle?: string
    jobLink?: string
    jobDescription?: string
    originalResume?: string
    tailoredResume?: string
    trashedAt: string
    createdAt?: string
  }>
  total?: number
  page?: number
  totalPages?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TrashResponse | { message: string, error?: string }>) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const { page = '1', limit = '10' } = req.query
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    const client = await clientPromise
    const db = client.db('resumai')
    const collection = db.collection('resumes')

    // Get trashed resumes with pagination
    const trashedResumes = await collection
      .find({ 
        trashed: true,
        trashedAt: { $exists: true, $ne: null }
      })
      .sort({ trashedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray()

    // Get total count of trashed resumes
    const total = await collection.countDocuments({ 
      trashed: true,
      trashedAt: { $exists: true, $ne: null }
    })

    // Format the response data
    const formattedResumes = trashedResumes.map(resume => ({
      _id: resume._id.toString(),
      jobTitle: resume.jobTitle,
      jobLink: resume.jobLink,
      jobDescription: resume.jobDescription,
      originalResume: resume.originalResume,
      tailoredResume: resume.tailoredResume,
      trashedAt: resume.trashedAt?.toISOString(),
      createdAt: resume.createdAt?.toISOString()
    }))

    return res.status(200).json({ 
      resumes: formattedResumes,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    })

  } catch (error) {
    console.error('Error fetching trashed resumes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ 
      message: 'Failed to fetch trashed resumes',
      error: errorMessage
    })
  }
}