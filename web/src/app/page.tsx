'use client';

import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Logo } from '@/components/ui/Logo';

// Animation variants
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutQuint } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

// Category icons
const CategoryIcons = {
  hairSalon: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  barberShop: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199" />
    </svg>
  ),
  spa: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
    </svg>
  ),
  fitness: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  medical: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  dental: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  nailSalon: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128z" />
    </svg>
  ),
  photography: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  ),
};

const categories = [
  { name: 'Hair Salons', icon: CategoryIcons.hairSalon, slug: 'hair-salons' },
  { name: 'Barber Shops', icon: CategoryIcons.barberShop, slug: 'barber-shops' },
  { name: 'Spa & Wellness', icon: CategoryIcons.spa, slug: 'spas-wellness', featured: true },
  { name: 'Fitness', icon: CategoryIcons.fitness, slug: 'fitness' },
  { name: 'Medical', icon: CategoryIcons.medical, slug: 'medical' },
  { name: 'Dental', icon: CategoryIcons.dental, slug: 'dental' },
  { name: 'Nail Salons', icon: CategoryIcons.nailSalon, slug: 'nail-salons' },
  { name: 'Photography', icon: CategoryIcons.photography, slug: 'photography' },
];

const features = [
  {
    title: 'Real-time Availability',
    description: 'See open slots as they happen. No more back-and-forth.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Verified Reviews',
    description: 'Real feedback from real customers you can trust.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Instant Confirmation',
    description: 'Book in seconds. Get confirmed immediately.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Email Reminders',
    description: 'Never miss an appointment. We\'ll remind you.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
];

const stats = [
  { value: 1000, suffix: '+', label: 'Providers' },
  { value: 50, suffix: 'K+', label: 'Bookings' },
  { value: 4.9, suffix: '', label: 'Rating' },
  { value: 10, suffix: '+', label: 'Cities' },
];

// Animated counter
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    value % 1 === 0 ? Math.floor(latest) : latest.toFixed(1)
  );
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2, ease: [0.16, 1, 0.3, 1] });
      const unsubscribe = rounded.on('change', (latest) => setDisplayValue(String(latest)));
      return () => { controls.stop(); unsubscribe(); };
    }
  }, [isInView, value, count, rounded]);

  return <span ref={ref}>{displayValue}{suffix}</span>;
}

// Bento Card Component
function BentoCard({
  children,
  className = '',
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const content = (
    <motion.div
      className={`bento-item group cursor-pointer ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] gradient-radial-accent opacity-30" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#262626] bg-[#0A0A0A] text-sm text-[#A1A1A1]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                One platform for all appointments
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold tracking-tight"
            >
              <span className="text-[#FAFAFA]">Book appointments</span>
              <br />
              <span className="text-accent-gradient">effortlessly.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-[#A1A1A1] max-w-2xl mx-auto"
            >
              Discover local services, check real-time availability, and book instantly.
              Your time, your way.
            </motion.p>

            {/* Search Bar */}
            <motion.form
              variants={fadeInUp}
              onSubmit={handleSearch}
              className="max-w-xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-2xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 blur transition-all duration-300" />
                <div className="relative flex items-center bg-[#0A0A0A] border border-[#262626] rounded-2xl overflow-hidden group-focus-within:border-[#10B981] transition-colors">
                  <svg className="w-5 h-5 text-[#525252] ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-4 bg-transparent text-[#FAFAFA] placeholder-[#525252] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="m-2 px-6 py-2 bg-[#10B981] text-black font-semibold rounded-xl hover:bg-[#34D399] transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#525252]"
            >
              {['Free to use', 'No signup required', 'Instant booking'].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1 }, y: { duration: 2, repeat: Infinity } }}
        >
          <svg className="w-6 h-6 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
              Browse Services
            </h2>
            <p className="text-[#A1A1A1]">
              Find what you need from our curated categories
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Category cards */}
            {categories.slice(0, 2).map((cat) => (
              <motion.div key={cat.name} variants={fadeInUp}>
                <BentoCard href={`/search?category=${cat.slug}`}>
                  <div className="text-[#10B981] mb-4">{cat.icon}</div>
                  <h3 className="font-semibold text-[#FAFAFA] group-hover:text-[#10B981] transition-colors">
                    {cat.name}
                  </h3>
                </BentoCard>
              </motion.div>
            ))}

            {/* Featured card - Spa */}
            <motion.div variants={fadeInUp} className="md:col-span-2 md:row-span-2">
              <BentoCard href="/search?category=spas-wellness" className="h-full bento-featured">
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-[#10B981]/20 text-[#10B981] rounded-full mb-4">
                      Featured
                    </span>
                    <h3 className="text-2xl font-bold text-[#FAFAFA] mb-2">Spa & Wellness</h3>
                    <p className="text-[#A1A1A1]">
                      Relax and rejuvenate. Book massages, facials, and wellness treatments.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-[#10B981] font-medium">
                    Explore
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </BentoCard>
            </motion.div>

            {/* More category cards */}
            {categories.slice(3, 5).map((cat) => (
              <motion.div key={cat.name} variants={fadeInUp}>
                <BentoCard href={`/search?category=${cat.slug}`}>
                  <div className="text-[#10B981] mb-4">{cat.icon}</div>
                  <h3 className="font-semibold text-[#FAFAFA] group-hover:text-[#10B981] transition-colors">
                    {cat.name}
                  </h3>
                </BentoCard>
              </motion.div>
            ))}

            {/* How it works card */}
            <motion.div variants={fadeInUp} className="md:col-span-2">
              <BentoCard className="h-full">
                <h3 className="text-lg font-semibold text-[#FAFAFA] mb-4">How it works</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', text: 'Search for a service' },
                    { step: '2', text: 'Pick an available time' },
                    { step: '3', text: 'Book instantly' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </span>
                      <span className="text-[#A1A1A1]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </motion.div>

            {/* Remaining categories */}
            {categories.slice(6).map((cat) => (
              <motion.div key={cat.name} variants={fadeInUp}>
                <BentoCard href={`/search?category=${cat.slug}`}>
                  <div className="text-[#10B981] mb-4">{cat.icon}</div>
                  <h3 className="font-semibold text-[#FAFAFA] group-hover:text-[#10B981] transition-colors">
                    {cat.name}
                  </h3>
                </BentoCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
              Why Book-iT?
            </h2>
            <p className="text-[#A1A1A1] max-w-2xl mx-auto">
              Simple, fast, reliable. Everything you need for seamless booking.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-[#0A0A0A] border border-[#262626] hover:border-[#10B981] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mb-4 group-hover:bg-[#10B981]/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[#FAFAFA] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#A1A1A1]">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="rounded-3xl gradient-accent p-12 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 dot-pattern opacity-20" />

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-[#262626]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="p-12 rounded-3xl bg-[#0A0A0A] border border-[#262626] relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-64 h-64 gradient-radial-accent opacity-50" />
              <div className="absolute bottom-0 left-0 w-48 h-48 gradient-radial-accent opacity-30" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-4">
                  Ready to get started?
                </h2>
                <p className="text-[#A1A1A1] mb-8 max-w-xl mx-auto">
                  Whether you're booking or providing services, Book-iT has you covered.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#10B981] text-black font-semibold rounded-xl hover:bg-[#34D399] transition-all"
                    >
                      Find Services
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/register/vendor"
                      className="inline-flex items-center gap-2 px-8 py-4 border border-[#262626] text-[#FAFAFA] font-semibold rounded-xl hover:border-[#10B981] hover:text-[#10B981] transition-all"
                    >
                      List Your Business
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pre-footer logo */}
      <section className="py-12 px-4 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Logo size="lg" />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
