import { requireVendor } from '@/lib/auth';
import Link from 'next/link';

export default async function VendorDashboardPage() {
  const { dbUser } = await requireVendor();
  const vendor = dbUser!.vendor!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vendor.businessName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vendor Dashboard</p>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Bookings</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{vendor.totalReviews}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {vendor.averageRating?.toFixed(1) || '-'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today's Schedule
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No bookings scheduled for today
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/vendor/services"
                className="block w-full px-4 py-2 text-left text-sm bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900"
              >
                Manage Services
              </Link>
              <Link
                href="/dashboard/vendor/availability"
                className="block w-full px-4 py-2 text-left text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Set Availability
              </Link>
              <Link
                href="/dashboard/vendor/bookings"
                className="block w-full px-4 py-2 text-left text-sm bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                View All Bookings
              </Link>
              <Link
                href={`/v/${vendor.slug}`}
                className="block w-full px-4 py-2 text-left text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                View Public Profile
              </Link>
            </div>
          </div>

          {/* Business Info */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Business Information
              </h2>
              <Link
                href="/dashboard/vendor/settings"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Edit
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Address</dt>
                <dd className="text-gray-900 dark:text-white mt-1">
                  {vendor.address}<br />
                  {vendor.city}, {vendor.state} {vendor.postalCode}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Contact</dt>
                <dd className="text-gray-900 dark:text-white mt-1">
                  {vendor.email}<br />
                  {vendor.phone || 'No phone'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500 dark:text-gray-400">Public URL</dt>
                <dd className="text-blue-600 mt-1">
                  <Link href={`/v/${vendor.slug}`}>
                    book-it.vercel.app/v/{vendor.slug}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Reviews
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No reviews yet
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
