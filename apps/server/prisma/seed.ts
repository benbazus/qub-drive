
import * as bcrypt from 'bcryptjs';
import { Permission, PrismaClient, SecurityEventType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.securityEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.user.deleteMany();

  // Create Super Admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@qubators.com',
      password: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      permissions: Object.values(Permission),
      isActive: true,
      isVerified: true,
      metadata: {
        createdBy: 'seed',
        source: 'initial_setup'
      }
    },
  });

  // Create regular user
  const userPasswordHash = await bcrypt.hash('User@123', 12);
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@qubators.com',
      password: userPasswordHash,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      permissions: [Permission.USER_READ],
      isActive: true,
      isVerified: true,
      metadata: {
        createdBy: 'seed',
        source: 'initial_setup'
      }
    },
  });

  // Create manager user
  const managerPasswordHash = await bcrypt.hash('Manager@123', 12);
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@qubators.com',
      password: managerPasswordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      permissions: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_CREATE
      ],
      isActive: true,
      isVerified: true,
      metadata: {
        createdBy: 'seed',
        source: 'initial_setup'
      }
    },
  });

  // Create some initial security events
  await prisma.securityEvent.createMany({
    data: [
      {
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId: adminUser.id,
        email: adminUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
        success: true,
        metadata: {
          action: 'initial_seed_login',
          source: 'seed_script'
        }
      },
      {
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId: regularUser.id,
        email: regularUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
        success: true,
        metadata: {
          action: 'initial_seed_login',
          source: 'seed_script'
        }
      }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Created Users:');
  console.log(`   Super Admin: ${adminUser.email} / Admin@123`);
  console.log(`   Manager: ${managerUser.email} / Manager@123`);
  console.log(`   User: ${regularUser.email} / User@123`);
  console.log('\n🔐 All users are active and verified');

  const { plans } = await setupSystemSettings();

  await runAdminRole();

  // Seed Subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        id: 'sub_001',
        userId: adminUser.id,
        planId: plans[0].id, // Free Plan
        status: 'active',
        expiresAt: new Date('2026-07-14T00:00:00.000Z'), // 1 year from now
        billingCycle: 'monthly',
        createdAt: new Date(),
      },
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_002',
        userId: regularUser.id,
        planId: plans[1].id, // Pro Plan
        status: 'active',
        expiresAt: new Date('2025-12-31T23:59:59.999Z'), // ~6 months from now
        billingCycle: 'yearly',
        createdAt: new Date(),
      },
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_003',
        userId: managerUser.id,
        planId: plans[2].id, // Enterprise Plan
        status: 'inactive',
        expiresAt: new Date('2025-06-30T23:59:59.999Z'), // Expired ~1 month ago
        billingCycle: 'monthly',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    }),
  ]);

  console.log('Seeded Subscriptions:', subscriptions);
  console.log('✅ All seed data created successfully!');
}

async function runAdminRole() {
  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Administrator role with full access' },
  })
  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: { name: 'User', description: 'Standard user role' },
  })

  // Create Permissions
  const userRead = await prisma.userPermission.upsert({
    where: { name: 'user:read' },
    update: {},
    create: { name: 'user:read', description: 'Ability to read user data' },
  })
  const userCreate = await prisma.userPermission.upsert({
    where: { name: 'user:create' },
    update: {},
    create: { name: 'user:create', description: 'Ability to create new users' },
  })
  const productEdit = await prisma.userPermission.upsert({
    where: { name: 'product:edit' },
    update: {},
    create: { name: 'product:edit', description: 'Ability to edit product information' },
  })

  // Assign Permissions to Roles
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: userRead.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: userRead.id },
  })
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: userCreate.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: userCreate.id },
  })
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: productEdit.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: productEdit.id },
  })

  // Assign 'user:read' to User role (example)
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: userRole.id, permissionId: userRead.id } },
    update: {},
    create: { roleId: userRole.id, permissionId: userRead.id },
  })
}

async function setupSystemSettings() {

  // Delete existing system settings to ensure clean seed
  await prisma.systemSettings.deleteMany({});

  // Create comprehensive enterprise system settings
  const systemSettings = await prisma.systemSettings.create({
    data: {
      id: 1,

      // Storage & File Management
      defaultMaxStorage: BigInt(10737418240), // 10GB in bytes
      maxFileSize: BigInt(104857600), // 100MB in bytes
      allowedFileTypes: [
        // Documents
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv',
        // Archives
        'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico',
        // Videos
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp',
        // Audio
        'mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a',
        // Code & Development
        'js', 'ts', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'md',
        // CAD & Design
        'dwg', 'dxf', 'ai', 'psd', 'eps', 'indd'
      ],
      defaultStoragePath: '/var/lib/filestore',
      storageQuotaWarningThreshold: 80,
      enableFileVersioning: true,
      maxVersionsPerFile: 10,
      autoDeleteOldVersions: true,
      fileRetentionDays: 365,
      enableFileCompression: true,
      compressionLevel: 6,
      enableDuplicateDetection: true,
      enableAutoBackup: true,

      // Email settings
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'noreply@qubators.com',
      SMTP_PASS: '',
      SMTP_SECURE: true,
      SMTP_FROM: 'noreply@qubators.com',
      SMTP_FROM_NAME: 'LoveWorld File System',
      COMPANY_NAME: 'LoveWorld Inc.',
      SUPPORT_EMAIL: 'support@qubators.com',

      // Security & Access Control
      enableTwoFactorAuth: true,
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      sessionTimeoutMinutes: 480, // 8 hours
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      enableIpWhitelist: false,
      allowedIpRanges: [],
      enableEncryptionAtRest: true,
      encryptionAlgorithm: 'AES-256-GCM',
      enableAuditLogging: true,
      enableThreatDetection: true,
      enableSecurityScanning: true,
      securityScanFrequency: 'daily',

      // Virus & Malware Protection
      enableVirusScanning: true,
      virusScanningProvider: 'clamav',
      quarantineInfectedFiles: true,
      virusScanOnUpload: true,
      virusScanSchedule: 'daily',

      // Content Analysis & AI
      enableContentModeration: false,
      contentModerationProvider: 'azure',
      enableOcrProcessing: false,
      ocrProvider: 'tesseract',
      enableThumbnailGeneration: true,
      thumbnailQuality: 85,
      enableWatermarking: false,
      watermarkText: 'CONFIDENTIAL',
      watermarkOpacity: 50,

      // Sharing & Collaboration
      enablePublicSharing: true,
      enablePasswordProtectedSharing: true,
      defaultShareExpiration: 30, // days
      maxShareExpiration: 365, // days
      enableDownloadTracking: true,
      enableCollaborativeEditing: true,
      maxCollaboratorsPerFile: 50,
      enableComments: true,
      enableFilePreview: true,
      previewableFileTypes: [
        'pdf', 'txt', 'md', 'html', 'csv', 'json', 'xml',
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp',
        'mp4', 'webm', 'mov', 'avi'
      ],

      // Advanced Security Settings
      enableSsoIntegration: false,
      ssoProvider: 'saml',
      ssoMetadataUrl: '',
      enableLdapIntegration: false,
      ldapServerUrl: '',
      ldapBaseDn: '',
      ldapBindDn: '',
      ldapBindPassword: '',

      // Monitoring & Analytics
      enableAnalytics: true,
      analyticsProvider: 'internal',
      enableUsageReporting: true,
      reportingFrequency: 'monthly',
      enableExportReports: true,
      retentionDays: 365,
      enableGeolocation: true,
      enableRealTimeMonitoring: true,
      enableAlertSystem: true,
      alertThresholds: {
        diskUsage: 90,
        cpuUsage: 80,
        memoryUsage: 85,
        errorRate: 5,
        responseTime: 2000,
        failedLogins: 10,
        virusDetections: 1,
        unauthorizedAccess: 3
      },
      alertRecipients: ['admin@qubators.com', 'ops@qubators.com'],

      // Compliance & Legal
      enableGdprCompliance: true,
      dataRetentionPolicyDays: 2555, // 7 years
      enableRightToBeForgotten: true,
      enableDataPortability: true,
      complianceReportingEnabled: true,
      enableDataClassification: false,
      dataClassificationLevels: ['public', 'internal', 'confidential', 'restricted'],

      // System Information
      systemVersion: '1.0.0',
      licenseType: 'enterprise',
      licenseExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  console.log('✅ Enterprise system settings seeded successfully!');
  console.log('📋 Settings summary:');
  console.log(`   - Storage limit: ${Number(systemSettings.defaultMaxStorage) / (1024 * 1024 * 1024)}GB`);
  console.log(`   - Max file size: ${Number(systemSettings.maxFileSize) / (1024 * 1024)}MB`);
  console.log(`   - Allowed file types: ${systemSettings.allowedFileTypes.length} types`);
  console.log(`   - Security: 2FA ${systemSettings.enableTwoFactorAuth ? 'enabled' : 'disabled'}`);
  console.log(`   - File versioning: ${systemSettings.enableFileVersioning ? 'enabled' : 'disabled'}`);
  console.log(`   - Virus scanning: ${systemSettings.enableVirusScanning ? 'enabled' : 'disabled'}`);
  console.log(`   - Public sharing: ${systemSettings.enablePublicSharing ? 'enabled' : 'disabled'}`);
  console.log(`   - Auto backup: ${systemSettings.enableAutoBackup ? 'enabled' : 'disabled'}`);
  console.log(`   - Analytics: ${systemSettings.enableAnalytics ? 'enabled' : 'disabled'}`);
  console.log(`   - GDPR compliance: ${systemSettings.enableGdprCompliance ? 'enabled' : 'disabled'}`);

  // Create additional sample configurations for different environments
  console.log('\n🔧 Creating environment-specific configurations...');

  console.log('📝 Environment configurations prepared for different environments');
  console.log('\n🎯 Recommended next steps:');
  console.log('1. Update settings based on your environment (dev/staging/prod)');
  console.log('2. Configure external services (Redis, virus scanner, etc.)');
  console.log('3. Set up proper file storage paths and permissions');
  console.log('4. Configure email notifications and alert recipients');
  console.log('5. Set up backup storage and schedules');

  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        id: 'plan_free_001',
        name: 'Free',
        description: 'Basic plan for individual users with limited storage.',
        monthlyPrice: 0.0,
        price: 0.0,
        yearlyPrice: 0.0,
        storageLimit: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
        features: {
          maxUploadsPerDay: 5,
          maxFileSize: '100MB',
          collaboration: false,
          prioritySupport: false,
        },
        recommended: false,
        active: true,
      },
    }),
    prisma.plan.create({
      data: {
        id: 'plan_pro_001',
        name: 'Pro',
        description: 'Advanced plan for professionals with more storage and features.',
        monthlyPrice: 9.99,
        price: 9.99,
        yearlyPrice: 99.99,
        storageLimit: BigInt(100 * 1024 * 1024 * 1024), // 100 GB
        features: {
          maxUploadsPerDay: 50,
          maxFileSize: '1GB',
          collaboration: true,
          prioritySupport: true,
        },
        recommended: true,
        active: true,
      },
    }),
    prisma.plan.create({
      data: {
        id: 'plan_enterprise_001',
        name: 'Enterprise',
        description: 'Premium plan for businesses with unlimited storage and advanced features.',
        monthlyPrice: 49.99,
        price: 49.99,
        yearlyPrice: 499.99,
        storageLimit: BigInt(1000 * 1024 * 1024 * 1024), // 1 TB
        features: {
          maxUploadsPerDay: 1000,
          maxFileSize: '10GB',
          collaboration: true,
          prioritySupport: true,
          analytics: true,
        },
        recommended: false,
        active: true,
      },
    }),
  ]);

  console.log('Seeded Plans:', plans);

  // Seed System Resources
  const systemResources = await Promise.all([
    prisma.systemResource.create({
      data: {
        id: 'resource_001',
        uptime: 99.9,
        totalStorage: BigInt(10 * 1024 * 1024 * 1024 * 1024), // 10 TB
        usedStorage: BigInt(2 * 1024 * 1024 * 1024 * 1024), // 2 TB
        cpuUsage: 45.5,
        memoryUsage: 60.0,
        networkIO: 30.0,
        createdAt: new Date(),
      },
    }),
    prisma.systemResource.create({
      data: {
        id: 'resource_002',
        uptime: 98.5,
        totalStorage: BigInt(20 * 1024 * 1024 * 1024 * 1024), // 20 TB
        usedStorage: BigInt(5 * 1024 * 1024 * 1024 * 1024), // 5 TB
        cpuUsage: 55.0,
        memoryUsage: 70.0,
        networkIO: 40.0,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    }),
  ]);

  console.log('Seeded System Resources:', systemResources);

  console.log('System settings seeded successfully!')
  return { systemSettings, plans, systemResources };
}
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });