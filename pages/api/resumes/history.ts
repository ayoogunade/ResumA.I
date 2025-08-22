// pages/api/resumes/history.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '../../../lib/mongodb'

export default async function handler(req:NextApiRequest,res:NextApiResponse) {
    if(req.method !=='GET'){
        res.status(405).json({message:'Method not allowed'});
    }
    try {
        const client= await clientPromise;
        const db = client.db('resumai');
        const collection=db.collection('resumes');

        const resumes = await collection
        .find({ trashed: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .project({
          jobTitle: 1,
          jobLink: 1,
          jobDescription: 1,
          OGResume: 1,
          tailoredResume: 1,
          createdAt: 1
        })
        .toArray();
    
        res.status(200).json({ resumes });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({messgage:'We Got An ERROR!(Internal server error)'})
        
    }
    
}