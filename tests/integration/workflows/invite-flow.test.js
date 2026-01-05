/**
 * Invite and Role Flow Integration Tests
 * Tests for invitation system and role-based access control
 */

const request = require('supertest');
const app = require('../../../src/app');
const { 
  setupTestDatabase, 
  cleanupTestDatabase,
  getAuthToken,
  createTestUser,
  createTestInvite,
  createExpiredInvite
} = require('../../helpers/test-setup');

describe('Invite System Integration Tests', () => {
  let adminToken, regularUserToken, inviteCode;

  beforeAll(async () => {
    await setupTestDatabase();
    adminToken = await getAuthToken('admin');
    regularUserToken = await getAuthToken('user');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/invites - Create Invite', () => {
    it('should allow admin to create invite', async () => {
      const inviteData = {
        email: 'newuser@example.com',
        role: 'reviewer',
        expiresIn: '7d'
      };
      
      const response = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        inviteCode: expect.any(String),
        email: inviteData.email,
        role: inviteData.role,
        expiresAt: expect.any(String),
        used: false
      });
      
      inviteCode = response.body.inviteCode;
    });

    it('should reject invite creation from non-admin', async () => {
      const inviteData = {
        email: 'another@example.com',
        role: 'reviewer'
      };
      
      await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inviteData)
        .expect(403);
    });

    it('should validate email format', async () => {
      const inviteData = {
        email: 'invalid-email',
        role: 'reviewer'
      };
      
      const response = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(400);
      
      expect(response.body.errors).toContainEqual(
        expect.stringMatching(/email/i)
      );
    });

    it('should validate role value', async () => {
      const inviteData = {
        email: 'user@example.com',
        role: 'invalid_role'
      };
      
      const response = await request(app)
        .post('/api/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(400);
      
      expect(response.body.errors).toContainEqual(
        expect.stringMatching(/role/i)
      );
    });
  });

  describe('POST /api/auth/signup - Signup with Invite', () => {
    it('should allow signup with valid invite code', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        inviteCode
      };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        user: {
          email: userData.email,
          name: userData.name,
          role: 'reviewer'
        },
        token: expect.any(String)
      });
    });

    it('should mark invite as used', async () => {
      const response = await request(app)
        .get(`/api/invites/${inviteCode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.used).toBe(true);
      expect(response.body.usedAt).toBeDefined();
    });

    it('should reject expired invite codes', async () => {
      // Create an expired invite
      const expiredInvite = await createExpiredInvite();
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'expired@example.com',
          password: 'Pass123!',
          name: 'Test',
          inviteCode: expiredInvite.code
        })
        .expect(410);
      
      expect(response.body.message).toMatch(/expired/i);
    });

    it('should reject already used invite codes', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Pass123!',
          name: 'Test',
          inviteCode // Already used above
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/already used|invalid/i);
    });
  });

  describe('GET /api/invites - List Invites', () => {
    it('should allow admin to list all invites', async () => {
      const response = await request(app)
        .get('/api/invites')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body.invites)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter invites by status', async () => {
      const response = await request(app)
        .get('/api/invites?status=unused')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const allUnused = response.body.invites.every(invite => !invite.used);
      expect(allUnused).toBe(true);
    });

    it('should reject non-admin access', async () => {
      await request(app)
        .get('/api/invites')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/invites/:code - Revoke Invite', () => {
    let revokeInviteCode;

    beforeEach(async () => {
      const invite = await createTestInvite(adminToken);
      revokeInviteCode = invite.inviteCode;
    });

    it('should allow admin to revoke unused invite', async () => {
      await request(app)
        .delete(`/api/invites/${revokeInviteCode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Verify it's revoked
      const response = await request(app)
        .get(`/api/invites/${revokeInviteCode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.revoked).toBe(true);
    });

    it('should prevent using revoked invite', async () => {
      await request(app)
        .delete(`/api/invites/${revokeInviteCode}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Pass123!',
          inviteCode: revokeInviteCode
        })
        .expect(400);
    });
  });
});

describe('Role Management Integration Tests', () => {
  let adminToken, moderatorToken, reviewerToken, userId;

  beforeAll(async () => {
    await setupTestDatabase();
    adminToken = await getAuthToken('admin');
    moderatorToken = await getAuthToken('moderator');
    reviewerToken = await getAuthToken('reviewer');
    userId = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('PUT /api/users/:id/role - Assign Role', () => {
    it('should allow admin to assign roles', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' })
        .expect(200);
      
      expect(response.body.role).toBe('moderator');
      expect(response.body.permissions).toContain('moderate_reviews');
    });

    it('should reject role assignment from non-admin', async () => {
      await request(app)
        .put(`/api/users/${userId}/role`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });

    it('should validate role value', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superuser' })
        .expect(400);
      
      expect(response.body.message).toMatch(/invalid role/i);
    });

    it('should log role changes', async () => {
      await request(app)
        .put(`/api/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'reviewer' });
      
      const logs = await request(app)
        .get(`/api/users/${userId}/audit-log`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const roleChange = logs.body.find(log => log.action === 'role_changed');
      expect(roleChange).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    const testCases = [
      {
        endpoint: 'POST /api/restaurants',
        requiredRole: 'admin',
        data: { name: 'Test Restaurant', address: 'Test' }
      },
      {
        endpoint: 'DELETE /api/reviews/:id',
        requiredRole: 'moderator',
        data: null
      },
      {
        endpoint: 'POST /api/reviews',
        requiredRole: 'reviewer',
        data: { restaurantId: 'rest-1', taste: 4, service: 4 }
      }
    ];

    testCases.forEach(({ endpoint, requiredRole, data }) => {
      describe(endpoint, () => {
        it(`should allow ${requiredRole} role access`, async () => {
          const [method, path] = endpoint.split(' ');
          const token = await getAuthToken(requiredRole);
          
          const response = await request(app)
            [method.toLowerCase()](path.replace(':id', 'test-id'))
            .set('Authorization', `Bearer ${token}`)
            .send(data);
          
          expect(response.status).not.toBe(403);
        });

        it('should deny access without proper role', async () => {
          const [method, path] = endpoint.split(' ');
          const token = await getAuthToken('basic'); // Lowest privilege
          
          await request(app)
            [method.toLowerCase()](path.replace(':id', 'test-id'))
            .set('Authorization', `Bearer ${token}`)
            .send(data)
            .expect(403);
        });
      });
    });
  });

  describe('Permission Inheritance', () => {
    it('should allow admin to perform all operations', async () => {
      const operations = [
        { method: 'post', path: '/api/reviews', data: { restaurantId: 'r1', taste: 4 } },
        { method: 'delete', path: '/api/reviews/test-id', data: null },
        { method: 'post', path: '/api/restaurants', data: { name: 'Test' } }
      ];
      
      for (const op of operations) {
        const response = await request(app)
          [op.method](op.path)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(op.data);
        
        expect(response.status).not.toBe(403);
      }
    });

    it('should respect permission hierarchy', async () => {
      const hierarchy = ['basic', 'reviewer', 'moderator', 'admin'];
      
      for (let i = 0; i < hierarchy.length; i++) {
        const role = hierarchy[i];
        const token = await getAuthToken(role);
        
        const response = await request(app)
          .get('/api/users/me/permissions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        
        // Higher roles should have more permissions
        if (i > 0) {
          const prevToken = await getAuthToken(hierarchy[i - 1]);
          const prevResponse = await request(app)
            .get('/api/users/me/permissions')
            .set('Authorization', `Bearer ${prevToken}`);
          
          expect(response.body.permissions.length).toBeGreaterThanOrEqual(
            prevResponse.body.permissions.length
          );
        }
      }
    });
  });
});

describe('Invite and Role Workflow Integration', () => {
  let adminToken;

  beforeAll(async () => {
    await setupTestDatabase();
    adminToken = await getAuthToken('admin');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should complete full invite-signup-role workflow', async () => {
    // Step 1: Admin creates invite with specific role
    const inviteResponse = await request(app)
      .post('/api/invites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'workflow@example.com',
        role: 'moderator',
        expiresIn: '7d'
      })
      .expect(201);
    
    const { inviteCode } = inviteResponse.body;
    
    // Step 2: User signs up with invite
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'workflow@example.com',
        password: 'Secure123!',
        name: 'Workflow User',
        inviteCode
      })
      .expect(201);
    
    const { user, token } = signupResponse.body;
    
    // Step 3: Verify user has correct role
    expect(user.role).toBe('moderator');
    
    // Step 4: Verify user can perform moderator actions
    await request(app)
      .delete('/api/reviews/spam-review-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(code => code !== 403);
    
    // Step 5: Admin promotes user
    await request(app)
      .put(`/api/users/${user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
      .expect(200);
    
    // Step 6: Verify new permissions
    const updatedUser = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(updatedUser.body.role).toBe('admin');
  });
});
