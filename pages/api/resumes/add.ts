//pages/api/resumes/add.ts
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

    const { name, email, summary, jobLink } = req.body

    if (!name || !email || !summary) {
      return res.status(400).json({ 
        success: false,
        error: "Name, email, and summary are required" 
      })
    }

    const result = await collection.insertOne({
      name,
      email,
      OGResume: summary,
      jobLink: jobLink || null,
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