import { getUserWithProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CustomerDashboardClient } from './CustomerDashboardClient';

export default async function DashboardPage() {
  const result = await getUserWithProfile();

  if (!result) {
    redirect('/login');
  }

  const { dbUser } = result;

  // Redirect based on role
  if (dbUser?.vendor) {
    redirect('/dashboard/vendor');
  }

  if (dbUser?.customer) {
    return <CustomerDashboardClient name={dbUser.customer.name} />;
  }

  // No profile yet - prompt to complete registration
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Complete Your Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please complete your registration to continue.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register/customer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Register as Customer
          </Link>
          <Link
            href="/register/vendor"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Register as Vendor
          </Link>
        </div>
      </div>
    </div>
  );
}
