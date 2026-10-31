import { Screen } from '@/components/screen';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterScreen() {
  return (
    <Screen className="flex-grow justify-center">
      <RegisterForm />
    </Screen>
  );
}
