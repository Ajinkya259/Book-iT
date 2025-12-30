import { getUserWithProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
    return <CustomerDashboard name={dbUser.customer.name} />;
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

function CustomerDashboard({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome, {name}!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customer Dashboard</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Bookings
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No upcoming bookings
            </p>
            <Link
              href="/search"
              className="mt-4 inline-block text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Find services to book
            </Link>
          </div>

          {/* Past Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Past Bookings
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No past bookings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/search"
                className="block w-full px-4 py-2 text-left text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Search for services
              </Link>
              <Link
                href="/profile"
                className="block w-full px-4 py-2 text-left text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Edit profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
