'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
import { VendorMap } from '@/components/maps/VendorMap';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  averageRating: number | null;
  totalReviews: number;
  image: string | null;
  services: Service[];
  categories: Category[];
  distance: number | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  vendorCount: number;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useLocation, setUseLocation] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCity) params.set('city', selectedCity);
      if (selectedCategory) params.set('category', selectedCategory);
      if (useLocation && userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
      }
      params.set('page', page.toString());

      const response = await fetch(`/api/vendors?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setVendors(data.vendors);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity, selectedCategory, useLocation, userLocation, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch {
      // Silently handle
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/search?${params.toString()}`);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUseLocation(true);
        },
        () => {
          setError('Could not get your location');
        }
      );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedCategory('');
    setUseLocation(false);
    setPage(1);
    router.push('/search');
  };

  const formatRating = (rating: number | null) => {
    if (!rating) return 'New';
    return rating.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Book-iT
            </Link>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services or businesses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="City"
                className="w-32 md:w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Clear all
                </button>
              </div>

              {/* Location */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </h3>
                <button
                  onClick={requestLocation}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                    useLocation
                      ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-500 text-purple-700 dark:text-purple-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {useLocation ? 'Using your location' : 'Use my location'}
                  </span>
                </button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                      !selectedCategory
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setPage(1);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors flex justify-between ${
                        selectedCategory === cat.slug
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-gray-400">{cat.vendorCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Searching...' : `${vendors.length} results found`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'map'
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <div className="space-y-4">
                {vendors.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No vendors found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  vendors.map((vendor) => (
                    <Link
                      key={vendor.id}
                      href={`/v/${vendor.slug}`}
                      className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex gap-4">
                          {/* Image placeholder */}
                          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                            {vendor.image ? (
                              <img
                                src={vendor.image}
                                alt={vendor.businessName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <svg
                                className="w-10 h-10 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {vendor.businessName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {vendor.city}, {vendor.state}
                                  {vendor.distance !== null && (
                                    <span className="ml-2">
                                      ({vendor.distance.toFixed(1)} mi away)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <svg
                                  className="w-4 h-4 text-yellow-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatRating(vendor.averageRating)}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  ({vendor.totalReviews})
                                </span>
                              </div>
                            </div>

                            {vendor.description && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {vendor.description}
                              </p>
                            )}

                            {/* Categories */}
                            {vendor.categories.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {vendor.categories.map((cat) => (
                                  <span
                                    key={cat.id}
                                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                  >
                                    {cat.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Services Preview */}
                            {vendor.services.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {vendor.services.map((service) => (
                                  <span
                                    key={service.id}
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                  >
                                    {service.name} - ${parseFloat(service.price).toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm bg-white dark:bg-gray-800 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm bg-white dark:bg-gray-800 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Map View */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <GoogleMapsProvider>
                  <VendorMap
                    vendors={vendors.filter((v) => v.latitude && v.longitude).map((v) => ({
                      id: v.id,
                      businessName: v.businessName,
                      slug: v.slug,
                      latitude: v.latitude!,
                      longitude: v.longitude!,
                      address: v.address,
                      city: v.city,
                      state: v.state,
                    }))}
                    center={userLocation || undefined}
                    height="600px"
                  />
                </GoogleMapsProvider>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
