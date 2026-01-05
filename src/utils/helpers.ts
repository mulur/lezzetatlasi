import crypto from 'crypto';

/**
 * Generate a cryptographically secure random invite code
 */
export function generateInviteCode(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  const bytes = crypto.randomBytes(length);
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  // Format as XXXX-XXXX-XXXX for readability
  return code.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length][s1.length] / maxLength;
}

/**
 * Detect suspicious patterns in email addresses
 */
export function detectSuspiciousEmailPatterns(email: string): string[] {
  const patterns: string[] = [];
  
  // Check for plus addressing abuse (email+1@domain.com, email+2@domain.com)
  if (/\+\d+@/.test(email)) {
    patterns.push('sequential_plus_addressing');
  }
  
  // Check for disposable email domains (simplified list)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com', 
    'guerrillamail.com', 'mailinator.com', 'trashmail.com'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    patterns.push('disposable_email_domain');
  }
  
  // Check for excessive dots (abuse of Gmail dot trick)
  const localPart = email.split('@')[0];
  if (localPart && (localPart.match(/\./g) || []).length > 2) {
    patterns.push('excessive_dots');
  }
  
  // Check for numeric-heavy patterns (bot-like)
  if (localPart && /\d{4,}/.test(localPart)) {
    patterns.push('numeric_heavy');
  }
  
  return patterns;
}

/**
 * Sanitize user input to prevent injection attacks
 * Note: For production, consider using a comprehensive library like DOMPurify
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 255); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  // 3-30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Hash IP address for privacy (one-way hash for abuse detection)
 */
export function hashIpAddress(ip: string, salt: string = 'default-salt'): string {
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date): boolean {
  return new Date() > date;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}
