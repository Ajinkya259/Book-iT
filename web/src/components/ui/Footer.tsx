'use client';

import Link from 'next/link';

const footerLinks = {
  customers: [
    { href: '/search', label: 'Find Services' },
    { href: '/register/customer', label: 'Create Account' },
    { href: '/dashboard/bookings', label: 'My Bookings' },
  ],
  businesses: [
    { href: '/register/vendor', label: 'List Your Business' },
    { href: '/dashboard/vendor', label: 'Vendor Dashboard' },
    { href: '/dashboard/vendor/services', label: 'Manage Services' },
  ],
  support: [
    { href: '/login', label: 'Sign In' },
    { href: '#', label: 'Help Center', disabled: true },
    { href: '#', label: 'Contact Us', disabled: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Book-iT</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              The universal appointment booking marketplace. One platform for all schedulable services.
            </p>
          </div>

          {/* For Customers */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">For Customers</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.customers.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">For Businesses</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.businesses.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <span className="text-gray-400 flex items-center gap-2">
                      {link.label}
                      <span className="text-xs bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-400">Soon</span>
                    </span>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Book-iT. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              The Google Maps of Appointments
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
