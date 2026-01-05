import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  inviteCode: {
    length: parseInt(process.env.INVITE_CODE_LENGTH || '12', 10),
    expiryDays: parseInt(process.env.INVITE_CODE_EXPIRY_DAYS || '30', 10),
    maxUses: parseInt(process.env.INVITE_CODE_MAX_USES || '1', 10),
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),
  },
  
  abusePrevent: {
    maxAccountsPerIp: parseInt(process.env.MAX_ACCOUNTS_PER_IP || '3', 10),
    duplicateDetectionThreshold: parseFloat(process.env.DUPLICATE_DETECTION_THRESHOLD || '0.85'),
  },
};
