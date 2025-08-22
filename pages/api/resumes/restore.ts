import { NextApiRequest, NextApiResponse } from 'next'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.body
    if (!id) return res.status(400).json({ message: 'Resume ID is required' })

    const client = await clientPromise
    const db = client.db('resumai')
    const collection = db.collection('resumes')

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          trashed: false,
          trashedAt: null
        }
      }
    )

    if (result.modifiedCount === 1) {
      return res.status(200).json({ message: 'Resume restored successfully' })
    }
    return res.status(404).json({ message: 'Resume not found' })
  } catch (error) {
    console.error('Restore Error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}