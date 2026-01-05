#!/usr/bin/env node

/**
 * Demo script to showcase the invite code and security system
 * This creates sample data and demonstrates the workflow
 */

const { UserService } = require('./dist/services/UserService');
const { InviteCodeService } = require('./dist/services/InviteCodeService');
const { AbusePreventionService } = require('./dist/services/AbusePreventionService');
const { AuditService } = require('./dist/services/AuditService');
const { Database } = require('./dist/database');
const { UserRole } = require('./dist/types');

async function demo() {
  console.log('🎫 Lezzet Atlası - Invite Code & Security System Demo\n');
  console.log('=' .repeat(60));

  const db = Database.getInstance();
  const userService = new UserService();
  const inviteCodeService = new InviteCodeService();
  const abusePreventionService = new AbusePreventionService();
  const auditService = new AuditService();

  try {
    // 1. Create Admin User
    console.log('\n📝 Step 1: Creating Admin User...');
    const adminResult = await userService.createUser(
      'admin@lezzetatlasi.com',
      'adminuser',
      'SecureAdminPass123!',
      '127.0.0.1'
    );
    
    if (!adminResult.success) {
      console.error('Failed to create admin:', adminResult.error);
      return;
    }
    
    // Promote to admin
    await db.updateUser(adminResult.user.id, { role: UserRole.ADMIN });
    console.log('✅ Admin user created:', adminResult.user.username);
    console.log('   Role:', UserRole.ADMIN);

    // 2. Admin generates invite codes
    console.log('\n📨 Step 2: Generating Invite Codes...');
    const invite1 = await inviteCodeService.generateInviteCode(
      adminResult.user.id,
      { purpose: 'New user invitation', maxUses: 1, expiryDays: 30 }
    );
    const invite2 = await inviteCodeService.generateInviteCode(
      adminResult.user.id,
      { purpose: 'Gurme invitation', maxUses: 1, expiryDays: 7 }
    );
    
    console.log('✅ Invite Code 1:', invite1.code);
    console.log('   Purpose:', invite1.metadata.purpose);
    console.log('   Expires:', invite1.expiresAt.toLocaleDateString());
    console.log('✅ Invite Code 2:', invite2.code);
    console.log('   Purpose:', invite2.metadata.purpose);
    console.log('   Expires:', invite2.expiresAt.toLocaleDateString());

    // 3. Register new user with invite code
    console.log('\n👤 Step 3: Registering New User with Invite Code...');
    const userResult = await userService.createUser(
      'gurme@lezzetatlasi.com',
      'gurmeuser',
      'UserPass123!',
      '192.168.1.1',
      adminResult.user.id
    );
    
    if (!userResult.success) {
      console.error('Failed to create user:', userResult.error);
      return;
    }
    
    // Redeem invite code
    const redemption = await inviteCodeService.redeemInviteCode(
      invite1.code,
      userResult.user.id
    );
    
    console.log('✅ User registered:', userResult.user.username);
    console.log('   Email:', userResult.user.email);
    console.log('   Role:', userResult.user.role);
    console.log('   Invite redeemed:', redemption.success);

    // 4. Check invite code stats
    console.log('\n📊 Step 4: Checking Invite Code Statistics...');
    const stats = await inviteCodeService.getInviteCodeStats(invite1.code);
    console.log('Invite Code:', stats.code);
    console.log('   Total Uses:', stats.totalUses);
    console.log('   Remaining Uses:', stats.remainingUses);
    console.log('   Is Active:', stats.isActive);
    console.log('   Is Expired:', stats.isExpired);

    // 5. Promote user to Gurme
    console.log('\n⬆️  Step 5: Promoting User to Gurme...');
    const promotion = await userService.promoteUser(
      userResult.user.id,
      adminResult.user.id
    );
    
    console.log('✅ User promoted to:', promotion.newRole);

    // 6. Gurme user generates invite
    console.log('\n🎫 Step 6: Gurme User Generating Invite Code...');
    const gurmeInvite = await inviteCodeService.generateInviteCode(
      userResult.user.id,
      { purpose: 'Friend invitation from Gurme', maxUses: 1 }
    );
    
    console.log('✅ Gurme invite code:', gurmeInvite.code);

    // 7. Test abuse prevention
    console.log('\n🛡️  Step 7: Testing Abuse Prevention...');
    const suspiciousCheck = await abusePreventionService.checkDuplicateAccount(
      'test+123@tempmail.com',
      'testuser',
      '192.168.1.1'
    );
    
    console.log('Suspicious patterns detected:', suspiciousCheck.suspiciousPatterns.length);
    if (suspiciousCheck.suspiciousPatterns.length > 0) {
      console.log('   Patterns:', suspiciousCheck.suspiciousPatterns.join(', '));
    }

    // 8. Add and check bad actor
    console.log('\n🚫 Step 8: Bad Actor Management...');
    await abusePreventionService.addBadActor(
      '10.0.0.1',
      'Multiple spam attempts',
      'high',
      false,
      60
    );
    
    const isBadActor = await abusePreventionService.isBadActor('10.0.0.1');
    console.log('✅ Bad actor added:', '10.0.0.1');
    console.log('   Is blocked:', isBadActor);

    // 9. Show audit logs
    console.log('\n📝 Step 9: Recent Audit Logs...');
    const logs = await auditService.getAuditLogs({ limit: 5 });
    console.log(`Total logged actions: ${logs.length}`);
    logs.slice(0, 3).forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.action} - ${log.success ? '✅' : '❌'}`);
    });

    // 10. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 System Summary:');
    console.log('   Total Users:', (await db.getAllUsers()).length);
    console.log('   Total Invite Codes:', (await db.getAllInviteCodes()).length);
    console.log('   Active Invites:', (await db.getAllInviteCodes()).filter(i => i.isActive).length);
    console.log('   Bad Actors:', (await abusePreventionService.getAllBadActors()).length);
    console.log('   Audit Logs:', (await auditService.getAuditLogs({})).length);
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\nTo start the API server, run: npm start');
    console.log('Then access the API at: http://localhost:3000');
    console.log('Health check: http://localhost:3000/health');
    
  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    process.exit(1);
  }
}

demo();
