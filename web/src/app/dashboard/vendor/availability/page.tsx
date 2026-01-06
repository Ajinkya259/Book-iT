'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout, vendorNavItems } from '@/components/ui/DashboardLayout';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((_, index) => ({
  dayOfWeek: index,
  startTime: '09:00',
  endTime: '17:00',
  isActive: index >= 1 && index <= 5,
}));

export default function VendorAvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    fetchAvailability();
    fetchVendorName();
  }, []);

  const fetchVendorName = async () => {
    try {
      const response = await fetch('/api/vendor/profile');
      const data = await response.json();
      if (response.ok) {
        setVendorName(data.vendor?.businessName || 'My Business');
      }
    } catch {
      // silently handle
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/vendor/availability');
      const data = await response.json();

      if (response.ok && data.availability.length > 0) {
        const merged = DEFAULT_SCHEDULE.map((day) => {
          const found = data.availability.find(
            (a: DaySchedule) => a.dayOfWeek === day.dayOfWeek
          );
          return found || day;
        });
        setSchedule(merged);
      }
    } catch {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, isActive: !day.isActive } : day
      )
    );
    setSuccess(false);
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/vendor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch {
      setError('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = (startTime: string, endTime: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.isActive ? { ...day, startTime, endTime } : day))
    );
    setSuccess(false);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Loading..."
        subtitle="Vendor"
        navItems={vendorNavItems}
        userType="vendor"
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={vendorName}
      subtitle="Vendor"
      navItems={vendorNavItems}
      userType="vendor"
    >
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set your working hours</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Availability saved successfully!
          </div>
        )}

        {/* Quick Apply */}
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick apply to all active days:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '9 AM - 5 PM', start: '09:00', end: '17:00' },
              { label: '8 AM - 6 PM', start: '08:00', end: '18:00' },
              { label: '10 AM - 8 PM', start: '10:00', end: '20:00' },
              { label: '7 AM - 3 PM', start: '07:00', end: '15:00' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleApplyToAll(preset.start, preset.end)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`flex items-center gap-4 p-5 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                !day.isActive ? 'bg-gray-50 dark:bg-gray-950' : ''
              }`}
            >
              {/* Day Toggle */}
              <button
                onClick={() => handleToggleDay(day.dayOfWeek)}
                className={`w-28 text-left font-semibold ${
                  day.isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {DAYS[day.dayOfWeek]}
              </button>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggleDay(day.dayOfWeek)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  day.isActive ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    day.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Time Inputs */}
              {day.isActive ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-sm flex-1">Closed</span>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Availability
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
          <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">About Availability</h3>
          <ul className="text-sm text-green-800 dark:text-green-400 space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              Toggle days on/off to set your working days
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              Set your start and end times for each day
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              Use quick apply buttons to set common hours
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
