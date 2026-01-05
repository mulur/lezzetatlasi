import { User, UserRole } from '../types';
import { Database } from '../database';
import bcrypt from 'bcrypt';
import { config } from '../utils/config';
import { 
  generateUserId, 
  isValidEmail, 
  isValidUsername, 
  sanitizeInput,
  addMinutes
} from '../utils/helpers';

export class UserService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    username: string,
    password: string,
    ipAddress?: string,
    invitedBy?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    // Validate input
    if (!isValidEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!isValidUsername(username)) {
      return { success: false, error: 'Invalid username format (3-30 chars, alphanumeric and underscore only)' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Check if user already exists
    const existingEmail = await this.db.getUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'Email already registered' };
    }

    const existingUsername = await this.db.getUserByUsername(username);
    if (existingUsername) {
      return { success: false, error: 'Username already taken' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Create user
    const user: User = {
      id: generateUserId(),
      email: sanitizeInput(email),
      username: sanitizeInput(username),
      passwordHash,
      role: UserRole.BASIC,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress,
      isActive: true,
      loginAttempts: 0,
      invitedBy,
    };

    await this.db.createUser(user);
    return { success: true, user };
  }

  /**
   * Authenticate a user
   */
  async authenticateUser(
    emailOrUsername: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    // Find user by email or username
    let user = await this.db.getUserByEmail(emailOrUsername);
    if (!user) {
      user = await this.db.getUserByUsername(emailOrUsername);
    }

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { success: false, error: 'Account is temporarily locked due to too many failed login attempts' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is inactive' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      const updates: Partial<User> = { loginAttempts: newAttempts };

      // Lock account if too many attempts
      if (newAttempts >= config.security.maxLoginAttempts) {
        updates.lockedUntil = addMinutes(new Date(), config.security.lockoutDurationMinutes);
      }

      await this.db.updateUser(user.id, updates);
      return { success: false, error: 'Invalid credentials' };
    }

    // Reset login attempts on successful login
    await this.db.updateUser(user.id, { loginAttempts: 0, lockedUntil: undefined });

    return { success: true, user };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    return this.db.getUserById(id);
  }

  /**
   * Promote user role
   */
  async promoteUser(userId: string, promotedBy: string): Promise<{
    success: boolean;
    newRole?: UserRole;
    error?: string;
  }> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const promoter = await this.db.getUserById(promotedBy);
    if (!promoter || promoter.role !== UserRole.ADMIN) {
      return { success: false, error: 'Insufficient permissions' };
    }

    let newRole: UserRole;
    if (user.role === UserRole.BASIC) {
      newRole = UserRole.GURME;
    } else if (user.role === UserRole.GURME) {
      newRole = UserRole.ADMIN;
    } else {
      return { success: false, error: 'User is already at maximum role' };
    }

    await this.db.updateUser(userId, { role: newRole });
    return { success: true, newRole };
  }

  /**
   * Demote user role
   */
  async demoteUser(userId: string, demotedBy: string): Promise<{
    success: boolean;
    newRole?: UserRole;
    error?: string;
  }> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const demoter = await this.db.getUserById(demotedBy);
    if (!demoter || demoter.role !== UserRole.ADMIN) {
      return { success: false, error: 'Insufficient permissions' };
    }

    let newRole: UserRole;
    if (user.role === UserRole.ADMIN) {
      newRole = UserRole.GURME;
    } else if (user.role === UserRole.GURME) {
      newRole = UserRole.BASIC;
    } else {
      return { success: false, error: 'User is already at minimum role' };
    }

    await this.db.updateUser(userId, { role: newRole });
    return { success: true, newRole };
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<boolean> {
    const user = await this.db.getUserById(userId);
    if (!user) return false;

    await this.db.updateUser(userId, { isActive: false });
    return true;
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(userId: string): Promise<boolean> {
    const user = await this.db.getUserById(userId);
    if (!user) return false;

    await this.db.updateUser(userId, { isActive: true, loginAttempts: 0, lockedUntil: undefined });
    return true;
  }
}
