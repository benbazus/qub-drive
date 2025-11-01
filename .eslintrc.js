module.exports = {
  root: true,
  extends: ['./packages/config/eslint/base.js'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'apps/backend/', // Rust project
  ],
};