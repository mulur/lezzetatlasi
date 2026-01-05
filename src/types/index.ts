export enum UserRole {
  BASIC = 'basic',
  GURME = 'gurme',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  isActive: boolean;
  loginAttempts: number;
  lockedUntil?: Date;
  invitedBy?: string;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  usedBy: string[];
  metadata?: {
    purpose?: string;
    targetRole?: UserRole;
  };
}

export interface RateLimitInfo {
  identifier: string; // IP or user ID
  endpoint: string;
  count: number;
  resetAt: Date;
  blocked: boolean;
}

export interface BadActorRecord {
  identifier: string; // IP or email pattern
  reason: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blockedUntil?: Date;
  permanent: boolean;
}

export interface DuplicateAccountCheck {
  userId: string;
  email: string;
  username: string;
  ipAddress: string;
  fingerprint?: string;
  similarityScore: number;
  suspiciousPatterns: string[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
}
