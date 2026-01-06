'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

interface NavbarProps {
  variant?: 'default' | 'transparent';
  showAuth?: boolean;
}

export function Navbar({ variant = 'default', showAuth = true }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: 'customer' | 'vendor' } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/customer/profile')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.profile) {
          setUser({ name: data.profile.name, role: 'customer' });
        }
      })
      .catch(() => {
        fetch('/api/vendor/profile')
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.profile) {
              setUser({ name: data.profile.businessName, role: 'vendor' });
            }
          })
          .catch(() => {});
      });
  }, []);

  const isTransparent = variant === 'transparent' && !isScrolled;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent'
          : 'glass-light dark:glass-dark shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo
            size="sm"
            variant={isTransparent ? 'light' : 'auto'}
            href="/"
          />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/search"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/search'
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                  : isTransparent
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Find Services
            </Link>
            <Link
              href="/register/vendor"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.includes('/register/vendor')
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                  : isTransparent
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              For Business
            </Link>
          </div>

          {/* Auth Buttons */}
          {showAuth && (
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={user.role === 'vendor' ? '/dashboard/vendor' : '/dashboard'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isTransparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/signout" method="post">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isTransparent
                          ? 'glass text-white hover:bg-white/20'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Sign Out
                    </motion.button>
                  </form>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isTransparent
                        ? 'text-white/90 hover:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Sign In
                  </Link>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/register"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="space-y-2">
                  <Link
                    href="/search"
                    className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Find Services
                  </Link>
                  <Link
                    href="/register/vendor"
                    className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    For Business
                  </Link>
                  <hr className="border-gray-200 dark:border-gray-700 my-2" />
                  {user ? (
                    <>
                      <Link
                        href={user.role === 'vendor' ? '/dashboard/vendor' : '/dashboard'}
                        className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <form action="/api/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center rounded-lg font-medium transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
