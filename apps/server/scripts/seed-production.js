#!/usr/bin/env node

/**
 * Production Database Seeder
 * 
 * This script safely seeds the production database with initial data.
 * It checks for existing data before seeding to prevent duplicates.
 * 
 * Usage:
 *   node scripts/seed-production.js
 *   npm run seed:prod
 */

const { PrismaClient, UserRole, Permission } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Starting production database seed...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@qubators.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping...');
    } else {
      // Create Super Admin user
      const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
      const adminUser = await prisma.user.create({
        data: {
          email: process.env.ADMIN_EMAIL || 'admin@qubators.com',
          password: adminPasswordHash,
          firstName: 'System',
          lastName: 'Administrator',
          role: UserRole.SUPER_ADMIN,
          permissions: Object.values(Permission),
          isActive: true,
          isVerified: true,
          metadata: {
            createdBy: 'production-seed',
            source: 'initial_setup',
            environment: process.env.NODE_ENV || 'production'
          }
        },
      });
      console.log(`✅ Created admin user: ${adminUser.email}`);
    }

    // Check if system settings exist
    const systemSettings = await prisma.systemSettings.findFirst();
    
    if (systemSettings) {
      console.log('✅ System settings already exist, skipping...');
    } else {
      // Create default system settings
      await prisma.systemSettings.create({
        data: {
          appName: process.env.APP_NAME || 'Qub Drive',
          defaultStoragePath: process.env.DEFAULT_STORAGE_PATH || '/app/storage',
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default
          maxStoragePerUser: BigInt(process.env.MAX_STORAGE_PER_USER || '10737418240'), // 10GB default
          allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'txt', 'csv', 'json', 'xml',
            'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
            'mp4', 'avi', 'mov', 'wmv',
            'mp3', 'wav', 'flac',
            'zip', 'rar', '7z', 'tar', 'gz'
          ],
          emailSettings: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            },
            from: process.env.SMTP_FROM || 'noreply@qubdrive.com'
          },
          securitySettings: {
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
            lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
            requireTwoFactor: process.env.REQUIRE_TWO_FACTOR === 'true',
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true,
              expirationDays: 90
            }
          }
        }
      });
      console.log('✅ Created default system settings');
    }

    // Create default plans if they don't exist
    const existingPlans = await prisma.plan.count();
    
    if (existingPlans > 0) {
      console.log('✅ Plans already exist, skipping...');
    } else {
      const plans = [
        {
          name: 'Free',
          description: 'Basic plan for individual users',
          price: 0,
          currency: 'USD',
          storageLimit: BigInt(5 * 1024 * 1024 * 1024), // 5GB
          maxFiles: 100,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          features: {
            basicStorage: true,
            fileSharing: true,
            versionHistory: false,
            collaboration: false,
            advancedSecurity: false
          },
          isActive: true
        },
        {
          name: 'Professional',
          description: 'Enhanced features for professionals',
          price: 9.99,
          currency: 'USD',
          storageLimit: BigInt(100 * 1024 * 1024 * 1024), // 100GB
          maxFiles: 1000,
          maxFileSize: 500 * 1024 * 1024, // 500MB
          features: {
            basicStorage: true,
            fileSharing: true,
            versionHistory: true,
            collaboration: true,
            advancedSecurity: false
          },
          isActive: true
        },
        {
          name: 'Enterprise',
          description: 'Complete solution for organizations',
          price: 29.99,
          currency: 'USD',
          storageLimit: BigInt(1024 * 1024 * 1024 * 1024), // 1TB
          maxFiles: -1, // unlimited
          maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
          features: {
            basicStorage: true,
            fileSharing: true,
            versionHistory: true,
            collaboration: true,
            advancedSecurity: true,
            apiAccess: true,
            prioritySupport: true
          },
          isActive: true
        }
      ];

      for (const plan of plans) {
        await prisma.plan.create({ data: plan });
        console.log(`✅ Created plan: ${plan.name}`);
      }
    }

    console.log('🎉 Production database seed completed successfully!');
    
    // Log summary
    const userCount = await prisma.user.count();
    const planCount = await prisma.plan.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Plans: ${planCount}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'production'}`);
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedProduction()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });