import { User, DuplicateAccountCheck, BadActorRecord } from '../types';
import { Database } from '../database';
import { 
  calculateStringSimilarity, 
  detectSuspiciousEmailPatterns,
  hashIpAddress
} from '../utils/helpers';
import { config } from '../utils/config';

export class AbusePreventionService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Check for duplicate or suspicious accounts
   */
  async checkDuplicateAccount(
    email: string,
    username: string,
    ipAddress: string
  ): Promise<DuplicateAccountCheck> {
    const allUsers = await this.db.getAllUsers();
    const suspiciousPatterns: string[] = [];
    let maxSimilarity = 0;

    // Check suspicious email patterns
    const emailPatterns = detectSuspiciousEmailPatterns(email);
    suspiciousPatterns.push(...emailPatterns);

    // Check for accounts from same IP
    const sameIpAccounts = await this.db.getUsersByIpAddress(ipAddress);
    if (sameIpAccounts.length >= config.abusePrevent.maxAccountsPerIp) {
      suspiciousPatterns.push('max_accounts_per_ip_exceeded');
    }

    // Check for similar usernames and emails
    for (const existingUser of allUsers) {
      const emailSimilarity = calculateStringSimilarity(
        email.split('@')[0],
        existingUser.email.split('@')[0]
      );
      const usernameSimilarity = calculateStringSimilarity(username, existingUser.username);

      maxSimilarity = Math.max(maxSimilarity, emailSimilarity, usernameSimilarity);

      if (emailSimilarity > config.abusePrevent.duplicateDetectionThreshold) {
        suspiciousPatterns.push(`similar_email_to_${existingUser.id}`);
      }

      if (usernameSimilarity > config.abusePrevent.duplicateDetectionThreshold) {
        suspiciousPatterns.push(`similar_username_to_${existingUser.id}`);
      }
    }

    return {
      userId: '', // Will be set after user creation
      email,
      username,
      ipAddress,
      similarityScore: maxSimilarity,
      suspiciousPatterns,
    };
  }

  /**
   * Check if IP or email is from a bad actor
   */
  async isBadActor(identifier: string): Promise<boolean> {
    return this.db.isBadActor(identifier);
  }

  /**
   * Add a bad actor to the blocklist
   */
  async addBadActor(
    identifier: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    permanent: boolean = false,
    blockDurationMinutes?: number
  ): Promise<BadActorRecord> {
    const record: BadActorRecord = {
      identifier,
      reason,
      detectedAt: new Date(),
      severity,
      permanent,
    };

    if (!permanent && blockDurationMinutes) {
      const blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + blockDurationMinutes);
      record.blockedUntil = blockedUntil;
    }

    return this.db.addBadActor(record);
  }

  /**
   * Analyze account creation patterns to detect abuse
   */
  async analyzeAccountCreationPattern(ipAddress: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check if IP is already flagged
    if (await this.isBadActor(ipAddress)) {
      reasons.push('ip_previously_flagged');
      riskScore += 50;
    }

    // Check number of accounts from this IP
    const accountsFromIp = await this.db.getUsersByIpAddress(ipAddress);
    if (accountsFromIp.length >= config.abusePrevent.maxAccountsPerIp) {
      reasons.push('multiple_accounts_same_ip');
      riskScore += 30;
    }

    // Check recent account creation velocity
    const recentAccounts = accountsFromIp.filter(user => {
      const hoursSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation < 24;
    });

    if (recentAccounts.length >= 3) {
      reasons.push('rapid_account_creation');
      riskScore += 40;
    }

    const suspicious = riskScore >= 50;
    return { suspicious, reasons, riskScore };
  }

  /**
   * Check if user behavior is suspicious
   */
  async checkSuspiciousBehavior(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      return { suspicious: false, reasons: [] };
    }

    const reasons: string[] = [];

    // Check failed login attempts
    if (user.loginAttempts >= config.security.maxLoginAttempts) {
      reasons.push('excessive_failed_logins');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      reasons.push('account_locked');
    }

    // Check if account is inactive
    if (!user.isActive) {
      reasons.push('inactive_account');
    }

    // Check email patterns
    const emailPatterns = detectSuspiciousEmailPatterns(user.email);
    if (emailPatterns.length > 0) {
      reasons.push(...emailPatterns);
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Get all bad actors
   */
  async getAllBadActors(): Promise<BadActorRecord[]> {
    return this.db.getAllBadActors();
  }

  /**
   * Remove a bad actor from blocklist
   */
  async removeBadActor(identifier: string): Promise<boolean> {
    const badActor = await this.db.getBadActor(identifier);
    if (!badActor) return false;

    // In a real implementation, you'd have a delete method
    // For now, we can mark as not permanent with expired block time
    await this.db.addBadActor({
      ...badActor,
      permanent: false,
      blockedUntil: new Date(Date.now() - 1000), // Already expired
    });
    
    return true;
  }
}
