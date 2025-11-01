#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying KingShare monorepo setup...\n');

const checks = [
  {
    name: 'Root package.json exists',
    check: () => fs.existsSync('package.json'),
  },
  {
    name: 'Apps directory structure',
    check: () => {
      const apps = ['backend', 'web', 'mobile', 'server'];
      return apps.every(app => fs.existsSync(`apps/${app}`));
    },
  },
  {
    name: 'Packages directory structure',
    check: () => {
      const packages = ['shared-types', 'utils', 'ui-components', 'config'];
      return packages.every(pkg => fs.existsSync(`packages/${pkg}`));
    },
  },
  {
    name: 'Shared packages built',
    check: () => {
      const packages = ['shared-types', 'utils', 'ui-components'];
      return packages.every(pkg => fs.existsSync(`packages/${pkg}/dist`));
    },
  },
  {
    name: 'Node modules installed',
    check: () => fs.existsSync('node_modules'),
  },
  {
    name: 'TypeScript configuration',
    check: () => fs.existsSync('tsconfig.json'),
  },
  {
    name: 'ESLint configuration',
    check: () => fs.existsSync('.eslintrc.js'),
  },
  {
    name: 'Prettier configuration',
    check: () => fs.existsSync('.prettierrc.js'),
  },
  {
    name: 'Development documentation',
    check: () => fs.existsSync('DEVELOPMENT.md'),
  },
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  const result = check();
  if (result) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 Monorepo setup is complete and verified!');
  console.log('\n🚀 Next steps:');
  console.log('  1. npm run dev        # Start all development servers');
  console.log('  2. npm run build      # Build all applications');
  console.log('  3. npm run test       # Run all tests');
  console.log('\n📖 See DEVELOPMENT.md for detailed instructions.');
} else {
  console.log('⚠️  Some checks failed. Please review the setup.');
  process.exit(1);
}