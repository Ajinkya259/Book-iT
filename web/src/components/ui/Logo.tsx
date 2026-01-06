'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 56, text: 'text-3xl' },
};

export function Logo({ size = 'md', showText = true, href = '/' }: LogoProps) {
  const { icon, text } = sizes[size];

  const content = (
    <motion.div
      className="flex items-center gap-2.5"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Logo Icon */}
      <motion.div
        className="relative"
        whileHover={{ rotate: [0, -3, 3, 0] }}
        transition={{ duration: 0.4 }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-xl blur-lg opacity-40"
          style={{
            width: icon,
            height: icon,
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
          }}
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
            <linearGradient id="logoGradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="calendarGradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Background rounded rectangle */}
          <rect
            x="2"
            y="2"
            width="52"
            height="52"
            rx="14"
            fill="url(#logoGradientEmerald)"
          />

          {/* Calendar body */}
          <rect
            x="12"
            y="16"
            width="32"
            height="28"
            rx="4"
            fill="#000000"
            fillOpacity="0.9"
          />

          {/* Calendar header */}
          <rect
            x="12"
            y="16"
            width="32"
            height="10"
            rx="4"
            fill="url(#calendarGradientEmerald)"
          />
          <rect
            x="12"
            y="22"
            width="32"
            height="4"
            fill="url(#calendarGradientEmerald)"
          />

          {/* Calendar rings */}
          <rect x="20" y="12" width="4" height="8" rx="2" fill="#000000" />
          <rect x="32" y="12" width="4" height="8" rx="2" fill="#000000" />

          {/* Calendar dots/grid - representing booked slots */}
          <circle cx="20" cy="32" r="2.5" fill="#10B981" />
          <circle cx="28" cy="32" r="2.5" fill="#10B981" />
          <circle cx="36" cy="32" r="2.5" fill="#404040" />
          <circle cx="20" cy="39" r="2.5" fill="#404040" />
          <circle cx="28" cy="39" r="2.5" fill="#10B981" />
          <circle cx="36" cy="39" r="2.5" fill="#10B981" />

          {/* Checkmark overlay */}
          <path
            d="M38 28L42 32L48 20"
            stroke="#FAFAFA"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Logo Text */}
      {showText && (
        <div className={`font-bold ${text} text-[#FAFAFA]`}>
          <span>Book</span>
          <span className="text-accent-gradient">-iT</span>
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
