// lib/database/resumeService.ts - Database Service Layer
import clientPromise from '../mongodb';
import { ObjectId } from 'mongodb';
import { ResumeDocument, CreateResumeInput, UpdateResumeInput, Collections } from './schema';

export class ResumeService {
  private static async getCollection() {
    const client = await clientPromise;
    const db = client.db('resumai');
    return db.collection<ResumeDocument>(Collections.RESUMES);
  }

  // Create a new resume
  static async create(input: CreateResumeInput): Promise<{ success: true; id: ObjectId } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      const document: Omit<ResumeDocument, '_id'> = {
        ...input,
        trashed: false,
        trashedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        downloadCount: 0,
      };

      const result = await collection.insertOne(document);
      
      if (!result.insertedId) {
        return { success: false, error: 'Failed to create resume' };
      }

      return { success: true, id: result.insertedId };
    } catch (error) {
      console.error('ResumeService.create error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Database error' };
    }
  }

  // Get resume by ID
  static async findById(id: string): Promise<{ success: true; resume: ResumeDocument } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      if (!ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid resume ID' };
      }

      const resume = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!resume) {
        return { success: false, error: 'Resume not found' };
      }

      // Update last accessed time
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { lastAccessed: new Date() },
          $inc: { viewCount: 1 }
        }
      );

      return { success: true, resume };
    } catch (error) {
      console.error('ResumeService.findById error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Get recent resumes (not trashed)
  static async findRecent(limit: number = 5): Promise<{ success: true; resumes: ResumeDocument[] } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      const resumes = await collection
        .find({ trashed: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return { success: true, resumes };
    } catch (error) {
      console.error('ResumeService.findRecent error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Update resume (partial updates allowed)
  static async update(id: string, input: Partial<UpdateResumeInput> | { tailoredResume: string }): Promise<{ success: true; resume: ResumeDocument } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      if (!ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid resume ID' };
      }

      const updateDoc = {
        ...input,
        updatedAt: new Date(),
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        return { success: false, error: 'Resume not found' };
      }

      return { success: true, resume: result };
    } catch (error) {
      console.error('ResumeService.update error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Soft delete (move to trash)
  static async moveToTrash(id: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      if (!ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid resume ID' };
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            trashed: true, 
            trashedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return { success: false, error: 'Resume not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('ResumeService.moveToTrash error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Restore from trash
  static async restoreFromTrash(id: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      if (!ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid resume ID' };
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            trashed: false,
            updatedAt: new Date()
          },
          $unset: { trashedAt: "" }
        }
      );

      if (result.matchedCount === 0) {
        return { success: false, error: 'Resume not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('ResumeService.restoreFromTrash error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Get trashed resumes
  static async findTrashed(): Promise<{ success: true; resumes: ResumeDocument[] } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      const resumes = await collection
        .find({ trashed: true })
        .sort({ trashedAt: -1 })
        .toArray();

      return { success: true, resumes };
    } catch (error) {
      console.error('ResumeService.findTrashed error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Permanently delete
  static async deleteForever(id: string): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      if (!ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid resume ID' };
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return { success: false, error: 'Resume not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('ResumeService.deleteForever error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  // Clean up old trashed items (call this periodically)
  static async cleanupOldTrashed(daysOld: number = 30): Promise<{ success: true; deletedCount: number } | { success: false; error: string }> {
    try {
      const collection = await this.getCollection();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        trashed: true,
        trashedAt: { $lt: cutoffDate }
      });

      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error('ResumeService.cleanupOldTrashed error:', error);
      return { success: false, error: 'Database error' };
    }
  }
}