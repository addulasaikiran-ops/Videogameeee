export default [
  { ignores: ['dist/**', 'node_modules/**', 'tools/**', 'server/node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.js', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        innerWidth: 'readonly', innerHeight: 'readonly', devicePixelRatio: 'readonly',
        performance: 'readonly', addEventListener: 'readonly', removeEventListener: 'readonly',
        localStorage: 'readonly', location: 'readonly', AudioContext: 'readonly',
        webkitAudioContext: 'readonly', Audio: 'readonly', console: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', requestAnimationFrame: 'readonly', URL: 'readonly',
        fetch: 'readonly', process: 'readonly', __dirname: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'prefer-const': 'warn',
    },
  },
];
