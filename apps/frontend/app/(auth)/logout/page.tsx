import Link from 'next/link';
import { AuthCard } from '../../../components/AuthCard';

export default function LogoutPage() {
  return (
    <AuthCard
      title="Signed out"
      subtitle="You have been securely logged out of DeepFinery Training Studio."
      footer={<Link href="/login" className="text-blue-600 hover:text-blue-500">Sign in again</Link>}
    >
      <p className="text-center text-sm text-slate-600">
        Close this tab or sign back in to continue orchestrating workflows.
      </p>
    </AuthCard>
  );
}
