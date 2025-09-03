// pages/api/admin/database.ts - Database management endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseManager } from '@/lib/database/init';
import { allowMethods, compose, errorHandler } from '@/lib/validation/middleware';
import { StandardApiResponse } from '@/types/resume';

interface DatabaseResponse {
  action: string;
  result: any;
  timestamp: string;
}

async function databaseHandler(req: NextApiRequest, res: NextApiResponse<StandardApiResponse<DatabaseResponse>>) {
  try {
    await compose(
      allowMethods(['POST', 'GET'])
    )(req, res, async () => {
      
      // Basic auth check (in production, use proper authentication)
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized access to admin endpoint',
          code: 'UNAUTHORIZED'
        });
      }

      const { action } = req.method === 'GET' ? req.query : req.body;

      let result;
      const actionType = action as string;

      switch (actionType) {
        case 'init':
          result = await DatabaseManager.initialize();
          break;
          
        case 'health':
          result = await DatabaseManager.healthCheck();
          break;
          
        case 'cleanup':
          const { days } = req.method === 'GET' ? req.query : req.body;
          result = await DatabaseManager.cleanup(days ? parseInt(days as string) : 30);
          break;
          
        case 'optimize':
          result = await DatabaseManager.optimize();
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Supported: init, health, cleanup, optimize',
            code: 'INVALID_ACTION'
          });
      }

      return res.status(200).json({
        success: true,
        message: 'Database operation completed',
        data: {
          action: actionType,
          result,
          timestamp: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default databaseHandler;