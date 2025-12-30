export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Book-iT
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            The universal appointment booking marketplace.
            <br />
            One platform for all schedulable services.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Find Services
            </a>
            <a
              href="/register/vendor"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              List Your Business
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Discover Nearby
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Find services near you with our location-based search
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Book Instantly
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See real-time availability and book with one click
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Trusted Reviews
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Read verified reviews from real customers
            </p>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Any Service. Any Time.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {['Barbers', 'Salons', 'Spas', 'Doctors', 'Dentists', 'Fitness', 'Gaming', 'Photography', 'Consulting', 'Tutoring'].map((category) => (
              <span
                key={category}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-blue-600 dark:bg-blue-700 rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-blue-100 mb-6">
            Join thousands of vendors already using Book-iT
          </p>
          <a
            href="/register/vendor"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Book-iT - The Google Maps of Appointments</p>
          <p className="mt-2">Built with Next.js, Supabase, and Prisma</p>
        </footer>
      </main>
    </div>
  );
}
