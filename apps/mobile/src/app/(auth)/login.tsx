import { Screen } from '@/components/screen';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginScreen() {
  return (
    <Screen className="flex-grow justify-center">
      <LoginForm />
    </Screen>
  );
}
