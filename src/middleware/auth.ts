import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          role: UserRole;
        };
        
        (req as AuthRequest).userId = decoded.userId;
        (req as AuthRequest).userRole = decoded.role;
        
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Admin authorization middleware - requires admin role
 */
export function adminMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (authReq.userRole !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    next();
  };
}

/**
 * Gurme or higher authorization middleware
 */
export function gurmeMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (authReq.userRole !== UserRole.GURME && authReq.userRole !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Gurme or admin access required' });
      return;
    }
    
    next();
  };
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, role: UserRole): string {
  // Type assertion needed due to TypeScript's strict type checking with jwt.SignOptions
  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}
