import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { InviteCodeService } from '../services/InviteCodeService';
import { AbusePreventionService } from '../services/AbusePreventionService';
import { AuditService } from '../services/AuditService';
import { authMiddleware, adminMiddleware, AuthRequest, generateToken } from '../middleware/auth';
import { rateLimitMiddleware, badActorMiddleware } from '../middleware/security';

const router = Router();
const userService = new UserService();
const inviteCodeService = new InviteCodeService();
const abusePreventionService = new AbusePreventionService();
const auditService = new AuditService();

/**
 * POST /api/users/register
 * Register a new user with invite code
 */
router.post(
  '/register',
  badActorMiddleware(),
  rateLimitMiddleware('/api/users/register'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, username, password, inviteCode } = req.body;
      const ipAddress = req.ip;

      // Validate required fields
      if (!email || !username || !password || !inviteCode) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Check for bad actor
      if (await abusePreventionService.isBadActor(ipAddress || 'unknown')) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Analyze account creation pattern
      const pattern = await abusePreventionService.analyzeAccountCreationPattern(ipAddress || 'unknown');
      if (pattern.suspicious && pattern.riskScore >= 80) {
        await auditService.logAction(
          'registration_blocked_suspicious',
          'user',
          { email, username, reasons: pattern.reasons, riskScore: pattern.riskScore },
          undefined,
          ipAddress,
          req.get('user-agent'),
          false
        );

        res.status(403).json({ error: 'Registration blocked due to suspicious activity' });
        return;
      }

      // Check for duplicate accounts
      const duplicateCheck = await abusePreventionService.checkDuplicateAccount(
        email,
        username,
        ipAddress || 'unknown'
      );

      if (duplicateCheck.suspiciousPatterns.length > 2) {
        await auditService.logAction(
          'registration_blocked_duplicate',
          'user',
          { email, username, patterns: duplicateCheck.suspiciousPatterns },
          undefined,
          ipAddress,
          req.get('user-agent'),
          false
        );

        // Flag as potential bad actor
        if (duplicateCheck.suspiciousPatterns.includes('max_accounts_per_ip_exceeded')) {
          await abusePreventionService.addBadActor(
            ipAddress || 'unknown',
            'Multiple account creation attempts',
            'medium',
            false,
            60
          );
        }

        res.status(400).json({
          error: 'Registration blocked',
          details: 'Suspicious account patterns detected',
        });
        return;
      }

      // Validate invite code
      const validation = await inviteCodeService.validateInviteCode(inviteCode);
      if (!validation.valid) {
        res.status(400).json({ error: validation.reason });
        return;
      }

      // Create user
      const result = await userService.createUser(
        email,
        username,
        password,
        ipAddress,
        validation.inviteCode?.createdBy
      );

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Redeem invite code
      await inviteCodeService.redeemInviteCode(inviteCode, result.user!.id);

      await auditService.logAction(
        'user_registered',
        'user',
        { userId: result.user!.id, email, username },
        result.user!.id,
        ipAddress,
        req.get('user-agent')
      );

      // Generate token
      const token = generateToken(result.user!.id, result.user!.role);

      res.status(201).json({
        success: true,
        user: {
          id: result.user!.id,
          email: result.user!.email,
          username: result.user!.username,
          role: result.user!.role,
        },
        token,
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

/**
 * POST /api/users/login
 * Authenticate user
 */
router.post(
  '/login',
  badActorMiddleware(),
  rateLimitMiddleware('/api/users/login'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { emailOrUsername, password } = req.body;
      const ipAddress = req.ip;

      if (!emailOrUsername || !password) {
        res.status(400).json({ error: 'Email/username and password are required' });
        return;
      }

      const result = await userService.authenticateUser(emailOrUsername, password);

      await auditService.logAction(
        'user_login',
        'user',
        { emailOrUsername, success: result.success },
        result.user?.id,
        ipAddress,
        req.get('user-agent'),
        result.success
      );

      if (!result.success) {
        res.status(401).json({ error: result.error });
        return;
      }

      const token = generateToken(result.user!.id, result.user!.role);

      res.status(200).json({
        success: true,
        user: {
          id: result.user!.id,
          email: result.user!.email,
          username: result.user!.username,
          role: result.user!.role,
        },
        token,
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Failed to log in' });
    }
  }
);

/**
 * GET /api/users/me
 * Get current user info
 */
router.get(
  '/me',
  authMiddleware(),
  rateLimitMiddleware('/api/users/me'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const user = await userService.getUserById(authReq.userId!);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }
);

/**
 * POST /api/users/:userId/promote
 * Promote user role (Admin only)
 */
router.post(
  '/:userId/promote',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/users/promote'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const result = await userService.promoteUser(userId, authReq.userId!);

      await auditService.logAction(
        'user_promoted',
        'user',
        { targetUserId: userId, newRole: result.newRole, success: result.success },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        result.success
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          newRole: result.newRole,
          message: 'User promoted successfully',
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      res.status(500).json({ error: 'Failed to promote user' });
    }
  }
);

/**
 * POST /api/users/:userId/demote
 * Demote user role (Admin only)
 */
router.post(
  '/:userId/demote',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/users/demote'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const result = await userService.demoteUser(userId, authReq.userId!);

      await auditService.logAction(
        'user_demoted',
        'user',
        { targetUserId: userId, newRole: result.newRole, success: result.success },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        result.success
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          newRole: result.newRole,
          message: 'User demoted successfully',
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      res.status(500).json({ error: 'Failed to demote user' });
    }
  }
);

/**
 * POST /api/users/:userId/deactivate
 * Deactivate user account (Admin only)
 */
router.post(
  '/:userId/deactivate',
  authMiddleware(),
  adminMiddleware(),
  rateLimitMiddleware('/api/users/deactivate'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const success = await userService.deactivateUser(userId);

      await auditService.logAction(
        'user_deactivated',
        'user',
        { targetUserId: userId },
        authReq.userId,
        req.ip,
        req.get('user-agent'),
        success
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'User deactivated successfully',
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }
);

export default router;
