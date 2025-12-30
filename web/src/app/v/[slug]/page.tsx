'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

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
  services: Service[];
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

  useEffect(() => {
    fetchVendor();
  }, [slug]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vendor Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{vendor.businessName}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {vendor.address}, {vendor.city}, {vendor.state}
            </span>
            {vendor.phone && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {vendor.phone}
              </span>
            )}
          </div>
          {vendor.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">{vendor.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            <p className="font-medium">Booking Confirmed!</p>
            <p className="text-sm">Your appointment has been scheduled. You can view it in your dashboard.</p>
            <Link href="/dashboard" className="text-sm underline mt-2 inline-block">
              View My Bookings
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services</h2>
            <div className="space-y-4">
              {vendor.services.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No services available</p>
                </div>
              ) : (
                vendor.services.map((service) => (
                  <div
                    key={service.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'ring-2 ring-purple-500'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedService(service);
                      setBookingSuccess(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {service.duration} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${parseFloat(service.price).toFixed(2)}
                        </p>
                        <button
                          className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Book Appointment</h2>

              {!selectedService ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Select a service to book
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Selected Service */}
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                    <p className="font-medium text-purple-900 dark:text-purple-300">{selectedService.name}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      {selectedService.duration} min • ${parseFloat(selectedService.price).toFixed(2)}
                    </p>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getMinDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Available Times
                      </label>
                      {slotsLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : slotsMessage && slots.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          {slotsMessage}
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No available slots for this date
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {slots.map((slot) => (
                            <button
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-2 py-2 text-sm rounded-lg transition-colors ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any special requests..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Confirm Button */}
                  {selectedSlot && (
                    <button
                      onClick={handleBooking}
                      disabled={bookingInProgress}
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bookingInProgress ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Booking...
                        </>
                      ) : (
                        <>Confirm Booking</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
