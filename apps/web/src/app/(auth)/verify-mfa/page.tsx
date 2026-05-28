import type { Metadata } from 'next';
import { MfaVerifyForm } from '@/components/auth/mfa-verify-form';

export const metadata: Metadata = { title: 'Two-Factor Authentication' };

export default function VerifyMfaPage() {
  return <MfaVerifyForm />;
}
