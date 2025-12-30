'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  isActive: index >= 1 && index <= 5, // Mon-Fri active by default
}));

export default function VendorAvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/vendor/availability');
      const data = await response.json();

      if (response.ok && data.availability.length > 0) {
        // Merge fetched data with default schedule
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/vendor"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set your working hours</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            Availability saved successfully!
          </div>
        )}

        {/* Quick Apply */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick apply to all active days:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyToAll('09:00', '17:00')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              9 AM - 5 PM
            </button>
            <button
              onClick={() => handleApplyToAll('08:00', '18:00')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              8 AM - 6 PM
            </button>
            <button
              onClick={() => handleApplyToAll('10:00', '20:00')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              10 AM - 8 PM
            </button>
            <button
              onClick={() => handleApplyToAll('07:00', '15:00')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              7 AM - 3 PM
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                !day.isActive ? 'bg-gray-50 dark:bg-gray-900/50' : ''
              }`}
            >
              {/* Day Toggle */}
              <button
                onClick={() => handleToggleDay(day.dayOfWeek)}
                className={`w-28 text-left font-medium ${
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  day.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    day.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Time Inputs */}
              {day.isActive ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Availability
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            About Availability
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Toggle days on/off to set your working days</li>
            <li>• Set your start and end times for each day</li>
            <li>• Use quick apply buttons to set common hours</li>
            <li>• For special days (holidays, etc.), use the Exceptions feature</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
