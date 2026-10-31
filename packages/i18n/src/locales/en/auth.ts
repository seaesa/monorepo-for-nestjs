export const auth = {
  fields: {
    email: 'Email',
    password: 'Password',
    name: 'Name',
  },
  login: {
    title: 'Sign in',
    submit: 'Sign in',
    noAccount: 'No account yet?',
  },
  register: {
    title: 'Create an account',
    submit: 'Create account',
    hasAccount: 'Already have an account?',
  },
  forgot: {
    link: 'Forgot your password?',
    title: 'Reset your password',
    submit: 'Send reset link',
    sent: 'If that address has an account, a reset link is on its way.',
  },
  reset: {
    title: 'Choose a new password',
    submit: 'Save password',
    done: 'Password changed. Sign in with the new one.',
  },
  verify: {
    title: 'Verify email',
    pending: 'Verifying your email…',
    done: 'Your email is verified.',
  },
  logout: 'Sign out',
} as const;
