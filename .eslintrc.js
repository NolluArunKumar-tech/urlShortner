module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  rules: {
    // Windows CRLF compatibility
    'linebreak-style': 'off',
    // Allow console for server-side logging
    'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    // Enforce consistent returns in functions
    'consistent-return': 'error',
    // Allow underscores for unused vars (common in callbacks)
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};