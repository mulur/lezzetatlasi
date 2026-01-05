import { Router, Request, Response } from 'express';
import { AbusePreventionService } from '../services/AbusePreventionService';
import { AuditService } from '../services/AuditService';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/security';

const router = Router();
const abusePreventionService = new AbusePreventionService();
const auditService = new AuditService();

/**
 * GET /api/admin/bad-actors
 * Get all bad actors (Admin only)
 */
router.get(
  '/bad-actors',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/bad-actors'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const badActors = await abusePreventionService.getAllBadActors();

      res.status(200).json({
        success: true,
        badActors,
      });
    } catch (error) {
      console.error('Error getting bad actors:', error);
      res.status(500).json({ error: 'Failed to get bad actors' });
    }
  }
);

/**
 * POST /api/admin/bad-actors
 * Add a bad actor to blocklist (Admin only)
 */
router.post(
  '/bad-actors',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/bad-actors'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { identifier, reason, severity, permanent, blockDurationMinutes } = req.body;

      if (!identifier || !reason || !severity) {
        res.status(400).json({ error: 'Identifier, reason, and severity are required' });
        return;
      }

      const record = await abusePreventionService.addBadActor(
        identifier,
        reason,
        severity,
        permanent || false,
        blockDurationMinutes
      );

      await auditService.logAction(
        'bad_actor_added',
        'security',
        { identifier, reason, severity, permanent },
        authReq.userId,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        success: true,
        badActor: record,
      });
    } catch (error) {
      console.error('Error adding bad actor:', error);
      res.status(500).json({ error: 'Failed to add bad actor' });
    }
  }
);

/**
 * DELETE /api/admin/bad-actors/:identifier
 * Remove a bad actor from blocklist (Admin only)
 */
router.delete(
  '/bad-actors/:identifier',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/bad-actors'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { identifier } = req.params;

      const success = await abusePreventionService.removeBadActor(identifier);

      await auditService.logAction(
        'bad_actor_removed',
        'security',
        { identifier },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        success
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Bad actor removed successfully',
        });
      } else {
        res.status(404).json({ error: 'Bad actor not found' });
      }
    } catch (error) {
      console.error('Error removing bad actor:', error);
      res.status(500).json({ error: 'Failed to remove bad actor' });
    }
  }
);

/**
 * GET /api/admin/audit-logs
 * Get audit logs (Admin only)
 */
router.get(
  '/audit-logs',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/audit-logs'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, action, limit } = req.query;

      const logs = await auditService.getAuditLogs({
        userId: userId as string,
        action: action as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }
);

/**
 * GET /api/admin/security-events
 * Get recent security events (Admin only)
 */
router.get(
  '/security-events',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/security-events'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit } = req.query;
      const events = await auditService.getSecurityEvents(
        limit ? parseInt(limit as string) : 100
      );

      res.status(200).json({
        success: true,
        events,
      });
    } catch (error) {
      console.error('Error getting security events:', error);
      res.status(500).json({ error: 'Failed to get security events' });
    }
  }
);

/**
 * GET /api/admin/users/:userId/activity
 * Get user activity summary (Admin only)
 */
router.get(
  '/users/:userId/activity',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/admin/users/activity'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const summary = await auditService.getUserActivitySummary(userId);

      res.status(200).json({
        success: true,
        summary,
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({ error: 'Failed to get user activity' });
    }
  }
);

export default router;
