import { InviteCodeService } from '../src/services/InviteCodeService';
import { UserService } from '../src/services/UserService';
import { AbusePreventionService } from '../src/services/AbusePreventionService';
import { Database } from '../src/database';
import { UserRole } from '../src/types';

describe('Invite Code System', () => {
  let inviteCodeService: InviteCodeService;
  let userService: UserService;
  let abusePreventionService: AbusePreventionService;
  let db: Database;
  let adminUserId: string;

  beforeEach(async () => {
    db = Database.getInstance();
    await db.clearAll();
    
    inviteCodeService = new InviteCodeService();
    userService = new UserService();
    abusePreventionService = new AbusePreventionService();

    // Create an admin user for testing
    const adminResult = await userService.createUser(
      'admin@test.com',
      'adminuser',
      'adminpassword123',
      '127.0.0.1'
    );
    
    if (!adminResult.success || !adminResult.user) {
      throw new Error('Failed to create admin user');
    }
    
    adminUserId = adminResult.user.id;
    await db.updateUser(adminUserId, { role: UserRole.ADMIN });
  });

  describe('Invite Code Generation', () => {
    it('should generate a valid invite code', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId);
      
      expect(inviteCode).toBeDefined();
      expect(inviteCode.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(inviteCode.isActive).toBe(true);
      expect(inviteCode.currentUses).toBe(0);
      expect(inviteCode.createdBy).toBe(adminUserId);
    });

    it('should generate unique invite codes', async () => {
      const code1 = await inviteCodeService.generateInviteCode(adminUserId);
      const code2 = await inviteCodeService.generateInviteCode(adminUserId);
      
      expect(code1.code).not.toBe(code2.code);
    });

    it('should respect custom configuration', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId, {
        maxUses: 5,
        expiryDays: 7,
        purpose: 'Test invitation',
      });
      
      expect(inviteCode.maxUses).toBe(5);
      expect(inviteCode.metadata?.purpose).toBe('Test invitation');
    });
  });

  describe('Invite Code Validation', () => {
    it('should validate a new invite code as valid', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId);
      const validation = await inviteCodeService.validateInviteCode(inviteCode.code);
      
      expect(validation.valid).toBe(true);
      expect(validation.inviteCode).toBeDefined();
    });

    it('should reject non-existent invite code', async () => {
      const validation = await inviteCodeService.validateInviteCode('INVALID-CODE');
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invite code not found');
    });

    it('should reject expired invite code', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId, {
        expiryDays: -1, // Already expired
      });
      const validation = await inviteCodeService.validateInviteCode(inviteCode.code);
      
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invite code has expired');
    });
  });

  describe('Invite Code Redemption', () => {
    it('should successfully redeem a valid invite code', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId);
      const userResult = await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      const redemption = await inviteCodeService.redeemInviteCode(
        inviteCode.code,
        userResult.user!.id
      );
      
      expect(redemption.success).toBe(true);
      
      // Check that the code was updated
      const stats = await inviteCodeService.getInviteCodeStats(inviteCode.code);
      expect(stats?.totalUses).toBe(1);
      expect(stats?.usedBy).toContain(userResult.user!.id);
    });

    it('should not allow double redemption by same user', async () => {
      const inviteCode = await inviteCodeService.generateInviteCode(adminUserId, {
        maxUses: 2, // Allow 2 uses so code doesn't become inactive after first use
      });
      const userResult = await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      await inviteCodeService.redeemInviteCode(inviteCode.code, userResult.user!.id);
      const secondRedemption = await inviteCodeService.redeemInviteCode(
        inviteCode.code,
        userResult.user!.id
      );
      
      expect(secondRedemption.success).toBe(false);
      expect(secondRedemption.reason).toContain('already used');
    });
  });

  describe('User Role Management', () => {
    it('should promote user from Basic to Gurme', async () => {
      const userResult = await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      const promotion = await userService.promoteUser(
        userResult.user!.id,
        adminUserId
      );
      
      expect(promotion.success).toBe(true);
      expect(promotion.newRole).toBe(UserRole.GURME);
    });

    it('should demote user from Gurme to Basic', async () => {
      const userResult = await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      await db.updateUser(userResult.user!.id, { role: UserRole.GURME });
      
      const demotion = await userService.demoteUser(
        userResult.user!.id,
        adminUserId
      );
      
      expect(demotion.success).toBe(true);
      expect(demotion.newRole).toBe(UserRole.BASIC);
    });
  });

  describe('Abuse Prevention', () => {
    it('should detect suspicious email patterns', async () => {
      const check = await abusePreventionService.checkDuplicateAccount(
        'test+1@tempmail.com',
        'testuser',
        '127.0.0.1'
      );
      
      expect(check.suspiciousPatterns.length).toBeGreaterThan(0);
      expect(check.suspiciousPatterns).toContain('disposable_email_domain');
    });

    it('should flag multiple accounts from same IP', async () => {
      // Create max allowed accounts
      for (let i = 0; i < 3; i++) {
        await userService.createUser(
          `user${i}@test.com`,
          `user${i}`,
          'password123',
          '192.168.1.1'
        );
      }
      
      // Check for new account from same IP
      const check = await abusePreventionService.checkDuplicateAccount(
        'newuser@test.com',
        'newuser',
        '192.168.1.1'
      );
      
      expect(check.suspiciousPatterns).toContain('max_accounts_per_ip_exceeded');
    });

    it('should add and check bad actors', async () => {
      await abusePreventionService.addBadActor(
        '192.168.1.100',
        'Spam attempt',
        'high',
        true
      );
      
      const isBad = await abusePreventionService.isBadActor('192.168.1.100');
      expect(isBad).toBe(true);
    });
  });

  describe('User Authentication', () => {
    it('should authenticate valid credentials', async () => {
      await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      const auth = await userService.authenticateUser('user@test.com', 'password123');
      
      expect(auth.success).toBe(true);
      expect(auth.user).toBeDefined();
      expect(auth.user?.email).toBe('user@test.com');
    });

    it('should reject invalid credentials', async () => {
      await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      const auth = await userService.authenticateUser('user@test.com', 'wrongpassword');
      
      expect(auth.success).toBe(false);
      expect(auth.error).toBe('Invalid credentials');
    });

    it('should lock account after max failed attempts', async () => {
      await userService.createUser(
        'user@test.com',
        'testuser',
        'password123',
        '127.0.0.1'
      );
      
      // Attempt login with wrong password multiple times
      for (let i = 0; i < 5; i++) {
        await userService.authenticateUser('user@test.com', 'wrongpassword');
      }
      
      // Next attempt should be locked
      const auth = await userService.authenticateUser('user@test.com', 'password123');
      
      expect(auth.success).toBe(false);
      expect(auth.error).toContain('locked');
    });
  });
});
