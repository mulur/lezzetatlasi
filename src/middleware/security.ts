import { Request, Response, NextFunction } from 'express';
import { Database } from '../database';
import { config } from '../utils/config';
import { AuditService } from '../services/AuditService';

const db = Database.getInstance();
const auditService = new AuditService();

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || 'unknown';
    
    try {
      // Clean expired rate limits periodically
      await db.cleanExpiredRateLimits();
      
      // Get current rate limit info
      let rateLimitInfo = await db.getRateLimit(identifier, endpoint);
      const now = new Date();
      
      if (!rateLimitInfo || rateLimitInfo.resetAt < now) {
        // Create new rate limit window
        rateLimitInfo = {
          identifier,
          endpoint,
          count: 1,
          resetAt: new Date(now.getTime() + config.rateLimit.windowMs),
          blocked: false,
        };
      } else {
        // Increment count
        rateLimitInfo.count += 1;
        
        // Check if exceeded
        if (rateLimitInfo.count > config.rateLimit.maxRequests) {
          rateLimitInfo.blocked = true;
          
          await auditService.logAction(
            'rate_limit_exceeded',
            endpoint,
            { count: rateLimitInfo.count, limit: config.rateLimit.maxRequests },
            undefined,
            identifier,
            req.get('user-agent'),
            false
          );
          
          res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((rateLimitInfo.resetAt.getTime() - now.getTime()) / 1000),
          });
          return;
        }
      }
      
      await db.setRateLimit(rateLimitInfo);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimit.maxRequests - rateLimitInfo.count).toString());
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetAt.toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next();
    }
  };
}

/**
 * Bad actor blocking middleware
 */
export function badActorMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || 'unknown';
    
    try {
      const isBadActor = await db.isBadActor(identifier);
      
      if (isBadActor) {
        await auditService.logAction(
          'bad_actor_blocked',
          req.path,
          { ip: identifier },
          undefined,
          identifier,
          req.get('user-agent'),
          false
        );
        
        res.status(403).json({
          error: 'Access denied',
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Bad actor middleware error:', error);
      next();
    }
  };
}

/**
 * Request logging middleware
 */
export function requestLoggerMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    // Log request
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      await auditService.logAction(
        `${req.method}_${req.path}`,
        req.path,
        {
          method: req.method,
          statusCode: res.statusCode,
          duration,
          body: req.body ? Object.keys(req.body) : undefined,
        },
        (req as any).userId,
        req.ip,
        req.get('user-agent'),
        success
      );
    });
    
    next();
  };
}
