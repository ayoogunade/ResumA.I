import mongoose, { Schema, models, model } from 'mongoose';

const ResumeSchema = new Schema({
  userId: String,
  originalText: String,
  jobDescription: String,
  tailoredText: String,
  status: { type: String, default: "active" },
  trashedAt: { type: Date, default: null },
}, { timestamps: true });

ResumeSchema.index({ trashedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 2 }); // TTL

export const Resume = models.Resume || model("Resume", ResumeSchema);

