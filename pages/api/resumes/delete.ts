// pages/api/resumes/delete.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(req:NextApiRequest,res:NextApiResponse) {
    if(req.method !=='DELETE'){
        return res.status(405).json({message:'Method not allowed'});
    }
    
    try {
        const client = await clientPromise
        const db = client.db('resumai')
        const collection = db.collection('resumes')

        const { id } = req.body;
        if(!id) return res.status(400).json({ message: 'Resume ID is required' })
        
        console.log('Trashing resume with ID:', id);
        
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                trashed: true,
                trashedAt: new Date()
              }
            }
          )
          
        console.log('Trash result:', result);
          
        if (result.modifiedCount === 1) {
            return res.status(200).json({ message: 'Resume moved to Trash' })
        } else {
            return res.status(404).json({ message: 'Resume not found' })
        }
        
    } catch (error) {
        console.error('Delete Error:',error);
        return res.status(500).json({message:'Internal server error'});
    }

}