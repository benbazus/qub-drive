#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up KingShare monorepo...\n');

// Install root dependencies
console.log('📦 Installing root dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build shared packages
console.log('\n🔨 Building shared packages...');
execSync('npm run build --workspace=packages/shared-types', { stdio: 'inherit' });
execSync('npm run build --workspace=packages/utils', { stdio: 'inherit' });
execSync('npm run build --workspace=packages/ui-components', { stdio: 'inherit' });

// Install app dependencies
console.log('\n📱 Installing app dependencies...');
execSync('npm install --workspace=apps/web', { stdio: 'inherit' });
execSync('npm install --workspace=apps/mobile', { stdio: 'inherit' });
execSync('npm install --workspace=apps/server', { stdio: 'inherit' });

// Setup Rust backend
console.log('\n🦀 Setting up Rust backend...');
try {
  execSync('cd apps/backend && cargo fetch', { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️  Rust setup failed. Make sure Rust is installed.');
}

console.log('\n✅ Setup complete! You can now run:');
console.log('  npm run dev        # Start all development servers');
console.log('  npm run dev:web    # Start web client only');
console.log('  npm run dev:mobile # Start mobile app only');
console.log('  npm run dev:server # Start API server only');
console.log('  npm run dev:backend # Start Rust backend only');