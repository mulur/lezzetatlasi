import { AuditLog } from '../types';
import { Database } from '../database';
import { generateUserId } from '../utils/helpers';

export class AuditService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Log an action for audit trail
   */
  async logAction(
    action: string,
    resource: string,
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    const log: AuditLog = {
      id: generateUserId(),
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success,
    };

    await this.db.addAuditLog(log);
  }

  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filter?: {
    userId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    return this.db.getAuditLogs(filter);
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(limit: number = 100): Promise<AuditLog[]> {
    const allLogs = await this.db.getAuditLogs({ limit });
    return allLogs.filter(log => 
      log.action.includes('login') ||
      log.action.includes('failed') ||
      log.action.includes('blocked') ||
      log.action.includes('security')
    );
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    recentActions: AuditLog[];
  }> {
    const logs = await this.db.getAuditLogs({ userId, limit: 1000 });
    
    return {
      totalActions: logs.length,
      successfulActions: logs.filter(l => l.success).length,
      failedActions: logs.filter(l => !l.success).length,
      recentActions: logs.slice(-10),
    };
  }
}
