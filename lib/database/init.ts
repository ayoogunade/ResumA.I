// lib/database/init.ts - Database initialization and optimization
import clientPromise from '../mongodb';
import { Collections, ResumeIndexes } from './schema';

export class DatabaseManager {
  
  // Initialize database with proper indexes and collections
  static async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      const client = await clientPromise;
      const db = client.db('resumai');
      
      // Ensure collections exist
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes(Collections.RESUMES)) {
        await db.createCollection(Collections.RESUMES);
        console.log(`Created collection: ${Collections.RESUMES}`);
      }
      
      // Create indexes for performance
      const resumeCollection = db.collection(Collections.RESUMES);
      
      for (const indexSpec of ResumeIndexes) {
        try {
          await resumeCollection.createIndex(indexSpec.key, {
            background: true, // Create index in background
            name: `idx_${Object.keys(indexSpec.key).join('_')}`
          });
          console.log(`Created index: ${JSON.stringify(indexSpec.key)}`);
        } catch (indexError) {
          // Index might already exist, which is fine
          if (!(indexError as any).message?.includes('already exists')) {
            console.warn(`Index creation warning:`, indexError);
          }
        }
      }
      
      // Set up TTL (Time To Live) for trashed items
      try {
        await resumeCollection.createIndex(
          { trashedAt: 1 },
          { 
            expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
            background: true,
            name: 'ttl_trashed_items'
          }
        );
        console.log('Created TTL index for trashed items (30 days)');
      } catch (ttlError) {
        if (!(ttlError as any).message?.includes('already exists')) {
          console.warn('TTL index creation warning:', ttlError);
        }
      }
      
      return {
        success: true,
        message: 'Database initialized successfully with indexes'
      };
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown initialization error'
      };
    }
  }
  
  // Check database health and performance
  static async healthCheck(): Promise<{
    success: boolean;
    stats: {
      collections: number;
      totalResumes: number;
      activeResumes: number;
      trashedResumes: number;
      indexes: string[];
      avgResponseTime: number;
    };
    recommendations?: string[];
  }> {
    try {
      const client = await clientPromise;
      const db = client.db('resumai');
      const resumeCollection = db.collection(Collections.RESUMES);
      
      const startTime = Date.now();
      
      // Get collection stats
      const collections = await db.listCollections().toArray();
      const totalResumes = await resumeCollection.countDocuments({});
      const activeResumes = await resumeCollection.countDocuments({ trashed: { $ne: true } });
      const trashedResumes = await resumeCollection.countDocuments({ trashed: true });
      
      // Get index information
      const indexes = await resumeCollection.listIndexes().toArray();
      const indexNames = indexes.map(idx => idx.name);
      
      const avgResponseTime = Date.now() - startTime;
      
      // Performance recommendations
      const recommendations = [];
      
      if (totalResumes > 10000 && !indexNames.includes('idx_createdAt')) {
        recommendations.push('Consider adding compound indexes for large datasets');
      }
      
      if (avgResponseTime > 1000) {
        recommendations.push('Database response time is slow. Consider connection pooling');
      }
      
      if (trashedResumes > activeResumes * 0.5) {
        recommendations.push('High number of trashed items. Consider cleanup');
      }
      
      return {
        success: true,
        stats: {
          collections: collections.length,
          totalResumes,
          activeResumes,
          trashedResumes,
          indexes: indexNames,
          avgResponseTime
        },
        recommendations: recommendations.length > 0 ? recommendations : undefined
      };
      
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        success: false,
        stats: {
          collections: 0,
          totalResumes: 0,
          activeResumes: 0,
          trashedResumes: 0,
          indexes: [],
          avgResponseTime: -1
        }
      };
    }
  }
  
  // Clean up old trashed items
  static async cleanup(daysOld: number = 30): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      const client = await clientPromise;
      const db = client.db('resumai');
      const resumeCollection = db.collection(Collections.RESUMES);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await resumeCollection.deleteMany({
        trashed: true,
        trashedAt: { $lt: cutoffDate }
      });
      
      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `Cleaned up ${result.deletedCount} old trashed items`
      };
      
    } catch (error) {
      console.error('Database cleanup failed:', error);
      return {
        success: false,
        deletedCount: 0,
        message: error instanceof Error ? error.message : 'Cleanup failed'
      };
    }
  }
  
  // Optimize database performance
  static async optimize(): Promise<{ success: boolean; message: string; optimizations: string[] }> {
    try {
      const client = await clientPromise;
      const db = client.db('resumai');
      const resumeCollection = db.collection(Collections.RESUMES);
      
      const optimizations = [];
      
      // Analyze query patterns and suggest optimizations
      const stats = await db.stats();
      
      if (stats.collections > 5) {
        optimizations.push('Consider archiving old collections');
      }
      
      // Check for unused indexes
      const indexStats = await resumeCollection.aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      const unusedIndexes = indexStats.filter(stat => stat.accesses.ops === 0);
      if (unusedIndexes.length > 0) {
        optimizations.push(`Found ${unusedIndexes.length} unused indexes that could be removed`);
      }
      
      // Create specific compound indexes
      try {
        await resumeCollection.createIndex(
          { trashed: 1, createdAt: -1 },
          { 
            background: true,
            name: 'compound_trashed_createdAt'
          }
        );
        optimizations.push('Created compound index: trashed_createdAt');
      } catch (indexError) {
        // Index might already exist
      }
      
      // Future user-specific index (commented out for now)
      /*
      try {
        await resumeCollection.createIndex(
          { userId: 1, trashed: 1 },
          { 
            background: true,
            name: 'compound_userId_trashed'
          }
        );
        optimizations.push('Created compound index: userId_trashed');
      } catch (indexError) {
        // Index might already exist
      }
      */
      
      return {
        success: true,
        message: 'Database optimization completed',
        optimizations
      };
      
    } catch (error) {
      console.error('Database optimization failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Optimization failed',
        optimizations: []
      };
    }
  }
}