// lib/validation/middleware.ts - Request validation middleware
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Sanitize string input
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and potential XSS
  const cleaned = purify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  // Remove excessive whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Rate limiting store (in-memory for simplicity - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // limit each IP to 100 requests per windowMs
) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const ip = (req.headers['x-forwarded-for'] as string) || 
               (req.socket?.remoteAddress) || 
               'unknown';
    const key = `${ip}:${req.url}`;
    const now = Date.now();
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (current.count >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    current.count++;
    next();
  };
}

// Validation middleware factory
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next: (validatedData: T) => void) => {
    try {
      // Sanitize request body
      const sanitizedBody = sanitizeObject(req.body);
      
      // Validate against schema
      const validatedData = schema.parse(sanitizedBody);
      
      next(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        });
      }
      
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
}

// Method validation middleware
export function allowMethods(methods: string[]) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    if (!methods.includes(req.method || '')) {
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`,
        code: 'METHOD_NOT_ALLOWED',
        allowedMethods: methods
      });
    }
    next();
  };
}

// Error handler middleware
export function errorHandler(
  error: Error,
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.error(`[${req.method} ${req.url}] Error:`, error);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
}

// Middleware types
type NextFunction = () => void | Promise<void>;
type MiddlewareFunction = (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => void | Promise<void>;
type ValidationMiddleware<T> = (req: NextApiRequest, res: NextApiResponse, next: (data: T) => void | Promise<void>) => void | Promise<void>;

// Compose middleware functions
export function compose(...middlewares: MiddlewareFunction[]) {
  return async (req: NextApiRequest, res: NextApiResponse, finalHandler?: () => void | Promise<void>) => {
    let index = 0;
    
    async function next(): Promise<void> {
      const middleware = middlewares[index++];
      if (middleware) {
        await middleware(req, res, next);
      } else if (finalHandler) {
        await finalHandler();
      }
    }
    
    return next();
  };
}

// Separate validation composer for typed validation
export function composeWithValidation<T>(
  ...middlewares: (MiddlewareFunction | ValidationMiddleware<T>)[]
) {
  return async (req: NextApiRequest, res: NextApiResponse, validationHandler: (data: T) => void | Promise<void>) => {
    let index = 0;
    
    async function next(validatedData?: T): Promise<void> {
      const middleware = middlewares[index++];
      if (middleware) {
        if (index === middlewares.length && validatedData !== undefined) {
          // Last middleware is validation, call with typed handler
          await (middleware as ValidationMiddleware<T>)(req, res, validationHandler);
        } else {
          // Regular middleware
          await (middleware as MiddlewareFunction)(req, res, next);
        }
      }
    }
    
    return next();
  };
}