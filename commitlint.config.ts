import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'api',
        'web',
        'mobile',
        'contracts',
        'client',
        'theme',
        'i18n',
        'typescript-config',
        'jest-config',
        'repo',
        'ci',
        'deps',
      ],
    ],
  },
};

export default config;
