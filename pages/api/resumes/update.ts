// pages/api/resumes/update.ts
import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Only PATCH requests allowed" })
  }

  try {
    const client = await clientPromise
    const db = client.db("resumai")
    const collection = db.collection("resumes")

    const { id, tailoredResume } = req.body

    if (!id || !tailoredResume) {
      return res.status(400).json({ error: "ID and tailored resume are required" })
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          tailoredResume: tailoredResume,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Resume not found" })
    }

    res.status(200).json({ 
      message: "Resume updated successfully",
      success: true 
    })

  } catch (error) {
    console.error("Update error:", error)
    res.status(500).json({ error: "Resume update failed" })
  }
}