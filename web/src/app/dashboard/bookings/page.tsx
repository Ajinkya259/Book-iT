'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout, customerNavItems } from '@/components/ui/DashboardLayout';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  customerNotes: string | null;
  vendor: {
    businessName: string;
    address: string;
    city: string;
    phone: string | null;
    slug: string;
  };
  service: {
    name: string;
    duration: number;
    price: string;
  };
  review: {
    id: string;
    rating: number;
  } | null;
}

const STATUS_CONFIG = {
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Pending' },
  CONFIRMED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Confirmed' },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Cancelled' },
  NO_SHOW: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'No Show' },
};

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({ isOpen: false, booking: null });
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchCustomerName();
  }, [filter]);

  const fetchCustomerName = async () => {
    try {
      const response = await fetch('/api/customer/profile');
      const data = await response.json();
      if (response.ok) {
        setCustomerName(data.customer?.name || 'My Account');
      }
    } catch {
      // silently handle
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/api/bookings';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Cancellation reason (optional):');
    if (reason === null) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: reason || null,
        }),
      });

      if (response.ok) {
        fetchBookings();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch {
      setError('Failed to cancel booking');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const isUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && ['PENDING', 'CONFIRMED'].includes(booking.status);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewModal.booking) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewModal.booking.id,
          rating,
          comment: comment || undefined,
        }),
      });

      if (response.ok) {
        setReviewModal({ isOpen: false, booking: null });
        fetchBookings();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch {
      setError('Failed to submit review');
    }
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter((b) => !isUpcoming(b));

  return (
    <DashboardLayout
      title={customerName}
      subtitle="Customer"
      navItems={customerNavItems}
      userType="customer"
    >
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your appointments</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Find a service provider to book your first appointment</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Services
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && filter === 'all' && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Upcoming
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      onCancel={() => handleCancel(booking.id)}
                      onReview={() => setReviewModal({ isOpen: true, booking })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past/All Bookings */}
            <section>
              {filter === 'all' && upcomingBookings.length > 0 && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Past
                </h2>
              )}
              <div className="space-y-4">
                {(filter === 'all' ? pastBookings : bookings).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    onCancel={() => handleCancel(booking.id)}
                    onReview={() => setReviewModal({ isOpen: true, booking })}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal.isOpen && reviewModal.booking && (
          <ReviewModal
            booking={reviewModal.booking}
            onClose={() => setReviewModal({ isOpen: false, booking: null })}
            onSubmit={handleReviewSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function BookingCard({
  booking,
  formatDate,
  formatTime,
  onCancel,
  onReview,
}: {
  booking: Booking;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  onCancel: () => void;
  onReview: () => void;
}) {
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const canReview = booking.status === 'COMPLETED' && !booking.review;
  const config = STATUS_CONFIG[booking.status];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {booking.service.name}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <Link href={`/v/${booking.vendor.slug}`} className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {booking.vendor.businessName}
              </Link>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span>{booking.vendor.address}, {booking.vendor.city}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
            </div>
          </div>

          {booking.customerNotes && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
              &quot;{booking.customerNotes}&quot;
            </p>
          )}

          <p className="mt-4 text-lg font-bold text-green-600 dark:text-green-400">
            ${parseFloat(booking.service.price).toFixed(2)}
          </p>
        </div>

        <div className="flex flex-row lg:flex-col gap-2">
          {canCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          {canReview && (
            <button
              onClick={onReview}
              className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors font-medium"
            >
              Leave Review
            </button>
          )}
          {booking.review && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Reviewed ({booking.review.rating}/5)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  booking,
  onClose,
  onSubmit,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Review Your Experience
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {booking.service.name} at {booking.vendor.businessName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-4xl focus:outline-none transition-transform hover:scale-110"
                >
                  <span
                    className={
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-200 dark:text-gray-700'
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
