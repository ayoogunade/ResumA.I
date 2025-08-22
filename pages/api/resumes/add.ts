// pages/api/resumes/add.ts
import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" })
  }

  try {
    const client = await clientPromise
    const db = client.db("resumai")
    const collection = db.collection("resumes")

    // UPDATED: Changed to match new frontend fields
    const { jobTitle, jobLink, jobDescription, OGResume } = req.body

    // UPDATED: Changed validation to new required fields
    if (!jobTitle || !jobDescription || !OGResume) {
      return res.status(400).json({ 
        success: false,
        error: "Job title, job description, and resume content are required" 
      })
    }

    const result = await collection.insertOne({
      // UPDATED: New field structure
      jobTitle,
      jobLink: jobLink || null,
      jobDescription,
      OGResume,
      tailoredResume: null,
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    res.status(201).json({ 
      success: true,
      message: "Resume inserted!",
      id: result.insertedId 
    })

  } catch (error) {
    console.error("Insert error:", error)
    res.status(500).json({ 
      success: false,
      error: "Resume insert failed" 
    })
  }
}