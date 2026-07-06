module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  // Compile-time constant injected by Vite (see vite.config.js `define`).
  globals: { __APP_VERSION__: 'readonly' },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'dev-dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // This project is plain JS + React and never adopted PropTypes (there is no
    // `prop-types` dependency). Enforcing it produced 300+ false errors that
    // buried real problems, so it is intentionally off. Type-safety for props is
    // a future migration to TypeScript, tracked in the threat model / tech debt.
    'react/prop-types': 'off',
    // Prose-heavy, multi-language UI: apostrophes and quotes in translated copy
    // are expected and safe in JSX text. Escaping them adds noise without value.
    'react/no-unescaped-entities': 'off',
  },
  overrides: [
    {
      // Serverless functions and Node-side build/config run in Node, not the
      // browser: give them process/Buffer/etc. so they don't trip no-undef.
      files: [
        'api/**/*.js',
        '*.config.js',
        'vite.config.js',
        'postcss.config.js',
        'tailwind.config.js',
        'scripts/**/*.js',
      ],
      env: { node: true, browser: false },
    },
    {
      // Vitest specs use Node globals (global, process, Buffer) for mocking.
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      env: { node: true, browser: true },
    },
  ],
}
