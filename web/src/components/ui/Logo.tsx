'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  href?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 56, text: 'text-3xl' },
};

export function Logo({ size = 'md', variant = 'auto', showText = true, href = '/' }: LogoProps) {
  const { icon, text } = sizes[size];

  const textColorClass = variant === 'light'
    ? 'text-white'
    : variant === 'dark'
    ? 'text-gray-900'
    : 'text-gray-900 dark:text-white';

  const content = (
    <motion.div
      className="flex items-center gap-2.5"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Logo Icon */}
      <motion.div
        className="relative"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-lg opacity-50"
          style={{ width: icon, height: icon }}
        />

        {/* Main icon container */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Background rounded rectangle */}
          <rect
            x="2"
            y="2"
            width="52"
            height="52"
            rx="14"
            fill="url(#logoGradient)"
          />

          {/* Calendar body */}
          <rect
            x="12"
            y="16"
            width="32"
            height="28"
            rx="4"
            fill="white"
            fillOpacity="0.95"
          />

          {/* Calendar header */}
          <rect
            x="12"
            y="16"
            width="32"
            height="10"
            rx="4"
            fill="url(#calendarGradient)"
          />
          <rect
            x="12"
            y="22"
            width="32"
            height="4"
            fill="url(#calendarGradient)"
          />

          {/* Calendar rings */}
          <rect x="20" y="12" width="4" height="8" rx="2" fill="white" />
          <rect x="32" y="12" width="4" height="8" rx="2" fill="white" />

          {/* Calendar dots/grid - representing booked slots */}
          <circle cx="20" cy="32" r="2.5" fill="#9333ea" />
          <circle cx="28" cy="32" r="2.5" fill="#9333ea" />
          <circle cx="36" cy="32" r="2.5" fill="#d4d4d8" />
          <circle cx="20" cy="39" r="2.5" fill="#d4d4d8" />
          <circle cx="28" cy="39" r="2.5" fill="#9333ea" />
          <circle cx="36" cy="39" r="2.5" fill="#9333ea" />

          {/* Checkmark overlay */}
          <path
            d="M38 28L42 32L48 20"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Logo Text */}
      {showText && (
        <div className={`font-bold ${text} ${textColorClass}`}>
          <span>Book</span>
          <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            -iT
          </span>
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
