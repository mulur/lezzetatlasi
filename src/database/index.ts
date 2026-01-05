import { User, InviteCode, RateLimitInfo, BadActorRecord, AuditLog } from '../types';

/**
 * In-memory database for demonstration purposes
 * In production, use a proper database like PostgreSQL, MongoDB, etc.
 */
export class Database {
  private static instance: Database;
  private users: Map<string, User> = new Map();
  private inviteCodes: Map<string, InviteCode> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private badActors: Map<string, BadActorRecord> = new Map();
  private auditLogs: AuditLog[] = [];

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // User operations
  async createUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByIpAddress(ipAddress: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.ipAddress === ipAddress);
  }

  // Invite code operations
  async createInviteCode(inviteCode: InviteCode): Promise<InviteCode> {
    this.inviteCodes.set(inviteCode.code, inviteCode);
    return inviteCode;
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    return this.inviteCodes.get(code);
  }

  async updateInviteCode(code: string, updates: Partial<InviteCode>): Promise<InviteCode | undefined> {
    const invite = this.inviteCodes.get(code);
    if (!invite) return undefined;
    const updatedInvite = { ...invite, ...updates };
    this.inviteCodes.set(code, updatedInvite);
    return updatedInvite;
  }

  async getInviteCodesByCreator(createdBy: string): Promise<InviteCode[]> {
    return Array.from(this.inviteCodes.values()).filter(i => i.createdBy === createdBy);
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return Array.from(this.inviteCodes.values());
  }

  // Rate limit operations
  async getRateLimit(identifier: string, endpoint: string): Promise<RateLimitInfo | undefined> {
    const key = `${identifier}:${endpoint}`;
    return this.rateLimits.get(key);
  }

  async setRateLimit(info: RateLimitInfo): Promise<void> {
    const key = `${info.identifier}:${info.endpoint}`;
    this.rateLimits.set(key, info);
  }

  async cleanExpiredRateLimits(): Promise<void> {
    const now = new Date();
    for (const [key, info] of this.rateLimits.entries()) {
      if (info.resetAt < now) {
        this.rateLimits.delete(key);
      }
    }
  }

  // Bad actor operations
  async addBadActor(record: BadActorRecord): Promise<BadActorRecord> {
    this.badActors.set(record.identifier, record);
    return record;
  }

  async getBadActor(identifier: string): Promise<BadActorRecord | undefined> {
    return this.badActors.get(identifier);
  }

  async isBadActor(identifier: string): Promise<boolean> {
    const record = this.badActors.get(identifier);
    if (!record) return false;
    if (record.permanent) return true;
    if (record.blockedUntil && record.blockedUntil > new Date()) return true;
    return false;
  }

  async getAllBadActors(): Promise<BadActorRecord[]> {
    return Array.from(this.badActors.values());
  }

  // Audit log operations
  async addAuditLog(log: AuditLog): Promise<void> {
    this.auditLogs.push(log);
    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  async getAuditLogs(filter?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    let logs = this.auditLogs;
    if (filter?.userId) {
      logs = logs.filter(l => l.userId === filter.userId);
    }
    if (filter?.action) {
      logs = logs.filter(l => l.action === filter.action);
    }
    if (filter?.limit) {
      logs = logs.slice(-filter.limit);
    }
    return logs;
  }

  // Utility for testing
  async clearAll(): Promise<void> {
    this.users.clear();
    this.inviteCodes.clear();
    this.rateLimits.clear();
    this.badActors.clear();
    this.auditLogs = [];
  }
}
