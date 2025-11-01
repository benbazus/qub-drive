#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🏗️  Building all KingShare applications...\n');

try {
  // Build shared packages first
  console.log('📦 Building shared packages...');
  execSync('npm run build --workspace=packages/shared-types', { stdio: 'inherit' });
  execSync('npm run build --workspace=packages/utils', { stdio: 'inherit' });
  execSync('npm run build --workspace=packages/ui-components', { stdio: 'inherit' });

  // Build applications
  console.log('\n🌐 Building web client...');
  execSync('npm run build --workspace=apps/web', { stdio: 'inherit' });

  console.log('\n📱 Building mobile app...');
  execSync('npm run build --workspace=apps/mobile', { stdio: 'inherit' });

  console.log('\n🖥️  Building server...');
  execSync('npm run build --workspace=apps/server', { stdio: 'inherit' });

  console.log('\n🦀 Building Rust backend...');
  execSync('cd apps/backend && cargo build --release', { stdio: 'inherit' });

  console.log('\n✅ All builds completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}