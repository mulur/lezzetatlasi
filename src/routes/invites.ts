import { Router, Request, Response } from 'express';
import { InviteCodeService } from '../services/InviteCodeService';
import { authMiddleware, gurmeMiddleware, AuthRequest } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/security';
import { AuditService } from '../services/AuditService';
import { UserRole } from '../types';

const router = Router();
const inviteCodeService = new InviteCodeService();
const auditService = new AuditService();

/**
 * POST /api/invites/generate
 * Generate a new invite code
 * Requires: Gurme or Admin role
 */
router.post(
  '/generate',
  authMiddleware(),
  gurmeMiddleware(),
  rateLimitMiddleware('/api/invites/generate'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { maxUses, expiryDays, purpose, targetRole } = req.body;

      const inviteCode = await inviteCodeService.generateInviteCode(
        authReq.userId!,
        {
          maxUses: maxUses ? parseInt(maxUses) : undefined,
          expiryDays: expiryDays ? parseInt(expiryDays) : undefined,
          purpose,
          targetRole: targetRole as UserRole,
        }
      );

      await auditService.logAction(
        'invite_code_generated',
        'invite_code',
        { code: inviteCode.code, maxUses: inviteCode.maxUses },
        authReq.userId,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        success: true,
        inviteCode: {
          code: inviteCode.code,
          expiresAt: inviteCode.expiresAt,
          maxUses: inviteCode.maxUses,
          metadata: inviteCode.metadata,
        },
      });
    } catch (error) {
      console.error('Error generating invite code:', error);
      res.status(500).json({ error: 'Failed to generate invite code' });
    }
  }
);

/**
 * POST /api/invites/redeem
 * Redeem an invite code
 * Requires: Authentication
 */
router.post(
  '/redeem',
  authMiddleware(),
  rateLimitMiddleware('/api/invites/redeem'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ error: 'Invite code is required' });
        return;
      }

      const result = await inviteCodeService.redeemInviteCode(code, authReq.userId!);

      await auditService.logAction(
        'invite_code_redeemed',
        'invite_code',
        { code, success: result.success, reason: result.reason },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        result.success
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Invite code redeemed successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.reason,
        });
      }
    } catch (error) {
      console.error('Error redeeming invite code:', error);
      res.status(500).json({ error: 'Failed to redeem invite code' });
    }
  }
);

/**
 * GET /api/invites/:code
 * Get invite code details
 * Requires: Authentication
 */
router.get(
  '/:code',
  authMiddleware(),
  rateLimitMiddleware('/api/invites/:code'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;

      const validation = await inviteCodeService.validateInviteCode(code);
      const stats = await inviteCodeService.getInviteCodeStats(code);

      if (!stats) {
        res.status(404).json({ error: 'Invite code not found' });
        return;
      }

      res.status(200).json({
        success: true,
        inviteCode: {
          code: stats.code,
          valid: validation.valid,
          reason: validation.reason,
          totalUses: stats.totalUses,
          remainingUses: stats.remainingUses,
          isExpired: stats.isExpired,
          isActive: stats.isActive,
        },
      });
    } catch (error) {
      console.error('Error getting invite code details:', error);
      res.status(500).json({ error: 'Failed to get invite code details' });
    }
  }
);

/**
 * GET /api/invites/my/codes
 * Get all invite codes created by the authenticated user
 * Requires: Authentication
 */
router.get(
  '/my/codes',
  authMiddleware(),
  rateLimitMiddleware('/api/invites/my/codes'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      const inviteCodes = await inviteCodeService.getInviteCodesByCreator(authReq.userId!);

      res.status(200).json({
        success: true,
        inviteCodes: inviteCodes.map(code => ({
          code: code.code,
          createdAt: code.createdAt,
          expiresAt: code.expiresAt,
          maxUses: code.maxUses,
          currentUses: code.currentUses,
          isActive: code.isActive,
          metadata: code.metadata,
        })),
      });
    } catch (error) {
      console.error('Error getting user invite codes:', error);
      res.status(500).json({ error: 'Failed to get invite codes' });
    }
  }
);

/**
 * DELETE /api/invites/:code
 * Deactivate an invite code
 * Requires: Admin role or code creator
 */
router.delete(
  '/:code',
  authMiddleware(),
  rateLimitMiddleware('/api/invites/:code'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { code } = req.params;

      const inviteCode = await inviteCodeService.getInviteCodeDetails(code);

      if (!inviteCode) {
        res.status(404).json({ error: 'Invite code not found' });
        return;
      }

      // Check if user is admin or the creator
      if (authReq.userRole !== UserRole.ADMIN && inviteCode.createdBy !== authReq.userId) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const success = await inviteCodeService.deactivateInviteCode(code);

      await auditService.logAction(
        'invite_code_deactivated',
        'invite_code',
        { code },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        success
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Invite code deactivated successfully',
        });
      } else {
        res.status(500).json({ error: 'Failed to deactivate invite code' });
      }
    } catch (error) {
      console.error('Error deactivating invite code:', error);
      res.status(500).json({ error: 'Failed to deactivate invite code' });
    }
  }
);

export default router;
