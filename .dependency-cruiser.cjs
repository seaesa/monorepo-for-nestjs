/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'apps-not-imported',
      comment: 'No package imports an app, and no app imports another app.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'apps-not-imported-cross-app',
      severity: 'error',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/', pathNot: '^apps/$1/' },
    },
    {
      name: 'contracts-pure',
      comment: 'Contracts are shared by every runtime: only zod and themselves.',
      severity: 'error',
      from: { path: '^packages/contracts/src' },
      to: {
        pathNot: ['^packages/contracts/src', 'node_modules/zod/'],
      },
    },
    {
      name: 'client-platform-agnostic',
      comment: 'packages/client runs on web and mobile: no framework or platform imports.',
      severity: 'error',
      from: { path: '^packages/client/src' },
      to: {
        path: '(^|node_modules/)(next|react-native[^/]*|expo[^/]*|@expo/[^/]+|react-dom)(/|$)',
      },
    },
    {
      name: 'feature-isolation',
      comment: 'A feature imports another feature only through its index.ts.',
      severity: 'error',
      from: { path: '^(apps/web|apps/mobile/src|packages/client/src)/features/([^/]+)/' },
      to: {
        path: '^(apps/web|apps/mobile/src|packages/client/src)/features/([^/]+)/',
        pathNot: ['^$1/features/$2/', '/features/[^/]+/index\\.tsx?$'],
      },
    },
    {
      name: 'api-module-isolation',
      comment: "A Nest module never reaches into another module's repository or processor.",
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/[^/]+/.+\\.(repository|processor)\\.ts$',
        pathNot: '^apps/api/src/modules/$1/',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      from: {
        path: '^(apps|packages)/[^/]+/(src|app|components|features|lib)/',
        pathNot: ['\\.spec\\.tsx?$', '/test/', '/scripts/'],
      },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules', '/dist/'] },
    exclude: {
      path: [
        '/dist/',
        '/\\.next/',
        '/\\.expo/',
        '/\\.turbo/',
        '/coverage/',
        '/generated/',
        'apps/api/prisma/migrations/',
        'apps/mobile/uniwind-types\\.d\\.ts$',
        'apps/web/next-env\\.d\\.ts$',
        '/node_modules/',
      ],
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types', 'react-native'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.d.ts'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
