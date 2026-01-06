'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardNavProps {
  title: string;
  subtitle?: string;
  items: NavItem[];
  userType: 'customer' | 'vendor';
}

export function DashboardNav({ title, subtitle, items, userType }: DashboardNavProps) {
  const pathname = usePathname();

  const colorClass = userType === 'vendor'
    ? 'from-green-600 to-emerald-600'
    : 'from-purple-600 to-indigo-600';

  const activeColorClass = userType === 'vendor'
    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
    : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300';

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Book-iT</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/dashboard/vendor' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? activeColorClass
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
