export const email = {
  welcome: {
    title: 'Welcome, {{name}}!',
    body: 'Your account is ready.',
  },
  verifyEmail: {
    subject: 'Confirm your email address',
    body: 'Open this link to confirm your email address: {{link}}',
  },
  passwordReset: {
    subject: 'Reset your password',
    body: 'Open this link to choose a new password: {{link}}. If you did not ask for it, ignore this email.',
  },
} as const;
