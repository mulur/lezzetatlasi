import { InviteCode, UserRole } from '../types';
import { Database } from '../database';
import { generateInviteCode, isExpired, addDays } from '../utils/helpers';
import { config } from '../utils/config';

export class InviteCodeService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Generate a new invite code
   */
  async generateInviteCode(
    createdBy: string,
    options?: {
      maxUses?: number;
      expiryDays?: number;
      purpose?: string;
      targetRole?: UserRole;
    }
  ): Promise<InviteCode> {
    const code = generateInviteCode(config.inviteCode.length);
    const now = new Date();
    
    const inviteCode: InviteCode = {
      code,
      createdBy,
      createdAt: now,
      expiresAt: addDays(now, options?.expiryDays || config.inviteCode.expiryDays),
      maxUses: options?.maxUses || config.inviteCode.maxUses,
      currentUses: 0,
      isActive: true,
      usedBy: [],
      metadata: {
        purpose: options?.purpose,
        targetRole: options?.targetRole,
      },
    };

    await this.db.createInviteCode(inviteCode);
    return inviteCode;
  }

  /**
   * Validate an invite code
   */
  async validateInviteCode(code: string): Promise<{
    valid: boolean;
    reason?: string;
    inviteCode?: InviteCode;
  }> {
    const inviteCode = await this.db.getInviteCode(code);

    if (!inviteCode) {
      return { valid: false, reason: 'Invite code not found' };
    }

    if (!inviteCode.isActive) {
      return { valid: false, reason: 'Invite code is inactive' };
    }

    if (isExpired(inviteCode.expiresAt)) {
      return { valid: false, reason: 'Invite code has expired' };
    }

    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return { valid: false, reason: 'Invite code has reached maximum uses' };
    }

    return { valid: true, inviteCode };
  }

  /**
   * Redeem an invite code
   */
  async redeemInviteCode(code: string, userId: string): Promise<{
    success: boolean;
    reason?: string;
  }> {
    const validation = await this.validateInviteCode(code);

    if (!validation.valid || !validation.inviteCode) {
      return { success: false, reason: validation.reason };
    }

    const inviteCode = validation.inviteCode;

    // Check if user already used this code
    if (inviteCode.usedBy.includes(userId)) {
      return { success: false, reason: 'User has already used this invite code' };
    }

    // Update invite code
    const updatedUsedBy = [...inviteCode.usedBy, userId];
    const updatedCurrentUses = inviteCode.currentUses + 1;
    const updatedIsActive = updatedCurrentUses < inviteCode.maxUses;

    await this.db.updateInviteCode(code, {
      currentUses: updatedCurrentUses,
      usedBy: updatedUsedBy,
      isActive: updatedIsActive,
    });

    return { success: true };
  }

  /**
   * Get invite code details
   */
  async getInviteCodeDetails(code: string): Promise<InviteCode | undefined> {
    return this.db.getInviteCode(code);
  }

  /**
   * Get all invite codes created by a user
   */
  async getInviteCodesByCreator(createdBy: string): Promise<InviteCode[]> {
    return this.db.getInviteCodesByCreator(createdBy);
  }

  /**
   * Deactivate an invite code
   */
  async deactivateInviteCode(code: string): Promise<boolean> {
    const inviteCode = await this.db.getInviteCode(code);
    if (!inviteCode) return false;

    await this.db.updateInviteCode(code, { isActive: false });
    return true;
  }

  /**
   * Get invite code statistics
   */
  async getInviteCodeStats(code: string): Promise<{
    code: string;
    totalUses: number;
    remainingUses: number;
    isExpired: boolean;
    isActive: boolean;
    usedBy: string[];
  } | undefined> {
    const inviteCode = await this.db.getInviteCode(code);
    if (!inviteCode) return undefined;

    return {
      code: inviteCode.code,
      totalUses: inviteCode.currentUses,
      remainingUses: inviteCode.maxUses - inviteCode.currentUses,
      isExpired: isExpired(inviteCode.expiresAt),
      isActive: inviteCode.isActive,
      usedBy: inviteCode.usedBy,
    };
  }
}
