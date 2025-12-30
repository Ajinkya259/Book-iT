'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  vendor: {
    businessName: string;
    address: string;
    city: string;
  };
  service: {
    name: string;
    duration: number;
    price: string;
  };
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function CustomerDashboardClient({ name }: { name: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && ['PENDING', 'CONFIRMED'].includes(b.status);
  });

  const pastBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status);
  });

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Bookings
              </h2>
              {upcomingBookings.length > 0 && (
                <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
                  {upcomingBookings.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No upcoming bookings
                </p>
                <Link
                  href="/search"
                  className="mt-4 inline-block text-purple-600 hover:text-purple-500 text-sm font-medium"
                >
                  Find services to book
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {booking.service.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.vendor.businessName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(booking.date)} at {formatTime(booking.startTime)}
                    </p>
                  </div>
                ))}
                {upcomingBookings.length > 3 && (
                  <Link
                    href="/dashboard/bookings"
                    className="text-purple-600 hover:text-purple-500 text-sm font-medium"
                  >
                    View all ({upcomingBookings.length})
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Past Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Past Bookings
              </h2>
              {pastBookings.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                  {pastBookings.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : pastBookings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No past bookings
              </p>
            ) : (
              <div className="space-y-3">
                {pastBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-start gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {booking.service.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(booking.date)}
                      </p>
                    </div>
                  </div>
                ))}
                {pastBookings.length > 3 && (
                  <Link
                    href="/dashboard/bookings"
                    className="text-purple-600 hover:text-purple-500 text-sm font-medium"
                  >
                    View all ({pastBookings.length})
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/search"
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for services
              </Link>
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View all bookings
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
