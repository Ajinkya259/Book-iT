'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  averageRating: number | null;
  totalReviews: number;
  services: Service[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string;
  serviceName: string;
  date: string;
  vendorResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function VendorPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchVendor();
  }, [slug]);

  useEffect(() => {
    if (vendor?.id) {
      fetchReviews();
    }
  }, [vendor?.id]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchSlots();
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedService, selectedDate]);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${slug}`);
      const data = await response.json();

      if (response.ok) {
        setVendor(data.vendor);
      } else {
        setError(data.error || 'Vendor not found');
      }
    } catch {
      setError('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!vendor?.id) return;
    setReviewsLoading(true);
    try {
      const response = await fetch(`/api/reviews?vendorId=${vendor.id}`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
        setRatingDistribution(data.ratingDistribution || {});
      }
    } catch {
      // Silently handle
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!vendor || !selectedService || !selectedDate) return;

    setSlotsLoading(true);
    setSlotsMessage(null);
    setSelectedSlot(null);

    try {
      const response = await fetch(
        `/api/vendors/${vendor.id}/slots?date=${selectedDate}&serviceId=${selectedService.id}`
      );
      const data = await response.json();

      if (response.ok) {
        setSlots(data.slots || []);
        if (data.message) {
          setSlotsMessage(data.message);
        }
      } else {
        setSlotsMessage(data.error || 'Failed to load slots');
        setSlots([]);
      }
    } catch {
      setSlotsMessage('Failed to load time slots');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!vendor || !selectedService || !selectedDate || !selectedSlot) return;

    setBookingInProgress(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          customerNotes: customerNotes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(true);
        setSelectedService(null);
        setSelectedDate('');
        setSelectedSlot(null);
        setCustomerNotes('');
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch {
      setError('Failed to create booking');
    } finally {
      setBookingInProgress(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vendor Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/search" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </Link>

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{vendor.businessName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {vendor.address}, {vendor.city}, {vendor.state}
                </span>
                {vendor.phone && (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {vendor.phone}
                  </span>
                )}
              </div>
            </div>

            {vendor.totalReviews > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-2xl font-bold text-white">{vendor.averageRating?.toFixed(1)}</span>
                </div>
                <p className="text-white/70 text-sm">{vendor.totalReviews} reviews</p>
              </div>
            )}
          </div>

          {vendor.description && (
            <p className="mt-6 text-white/80 max-w-3xl">{vendor.description}</p>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-6 py-4 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Booking Confirmed!</p>
                <p className="text-sm mt-1 text-green-600 dark:text-green-500">Your appointment has been scheduled. You can view it in your dashboard.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium mt-3 hover:underline">
                  View My Bookings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Services</h2>
            <div className="space-y-4">
              {vendor.services.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                  <div className="w-14 h-14 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No services available</p>
                </div>
              ) : (
                vendor.services.map((service) => (
                  <div
                    key={service.id}
                    className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-purple-500 shadow-lg shadow-purple-500/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                    onClick={() => {
                      setSelectedService(service);
                      setBookingSuccess(false);
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {service.duration} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${parseFloat(service.price).toFixed(0)}
                        </p>
                        <button
                          className="mt-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                            setBookingSuccess(false);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Book Appointment</h2>

              {!selectedService ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a service to book
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Selected Service */}
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-300">{selectedService.name}</p>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-0.5">
                          {selectedService.duration} min
                        </p>
                      </div>
                      <p className="font-bold text-purple-900 dark:text-purple-300">
                        ${parseFloat(selectedService.price).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getMinDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Available Times
                      </label>
                      {slotsLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : slotsMessage && slots.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          {slotsMessage}
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          No available slots for this date
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {slots.map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3 py-2.5 text-sm rounded-xl font-medium transition-all ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                              }`}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Notes */}
                  {selectedSlot && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any special requests..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>
                  )}

                  {/* Confirm Button */}
                  {selectedSlot && (
                    <button
                      onClick={handleBooking}
                      disabled={bookingInProgress}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25"
                    >
                      {bookingInProgress ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          Confirm Booking
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Reviews {vendor.totalReviews > 0 && `(${vendor.totalReviews})`}
          </h2>

          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-white font-medium">No reviews yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Be the first to review after your appointment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rating Summary */}
              {vendor.totalReviews > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 dark:text-white">
                        {vendor.averageRating?.toFixed(1)}
                      </div>
                      <div className="flex justify-center mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(vendor.averageRating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-200 dark:text-gray-700'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {vendor.totalReviews} reviews
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-3">{rating}</span>
                          <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full transition-all"
                              style={{
                                width: `${vendor.totalReviews > 0 ? ((ratingDistribution[rating] || 0) / vendor.totalReviews) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">
                            {ratingDistribution[rating] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{review.customerName}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{review.serviceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-4 text-gray-600 dark:text-gray-300">{review.comment}</p>
                  )}
                  {review.vendorResponse && (
                    <div className="mt-4 pl-4 border-l-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r-xl">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Response from {vendor.businessName}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{review.vendorResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
