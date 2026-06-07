import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',

      'apps/web/public/**',
      'packages/database/generated/**',

      // Application source is temporarily excluded and will be
      // re-enabled incrementally in follow-up issue #46.
      'apps/web/src/**',
      'apps/api/src/**',

      // generated output
      'packages/database/dist/**',
      'packages/shared/dist/**',

      'apps/web/copy-cesium-assets.js',
      '**/next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parser: tseslint.parser,
    },
  },
];
