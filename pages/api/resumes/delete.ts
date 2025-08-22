// pages/api/resumes/delete.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(req:NextApiRequest,res:NextApiResponse) {
    if(req.method !=='DELETE'){
        res.status(405).json({message:'Method not allowed'});
    }
    try {
        const client = await clientPromise
        const db = client.db('resumai')
        const collection = db.collection('resumes')

        const { id } = req.body;
        if(!id) return res.status(400).json({ message: 'Resume ID is required' })
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                trashed: true,
                trashedAt: new Date()
              }
            }
          )
          if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Resume moved to Trash' })
          }
        
    } catch (error) {
        console.error('Delete Error:',error);
        res.status(500).json({messgage:'We Got An ERROR!(Internal server error)'});
        
    }

}