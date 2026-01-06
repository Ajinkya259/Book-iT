'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Search Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services or businesses..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-0 shadow-lg focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="City"
                className="w-full md:w-48 pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-0 shadow-lg focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Location
                </h3>
                <button
                  onClick={requestLocation}
                  className={`w-full px-4 py-3 text-sm rounded-xl border-2 transition-all ${
                    useLocation
                      ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {useLocation ? 'Using your location' : 'Use my location'}
                  </span>
                </button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setPage(1);
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left rounded-xl transition-colors ${
                      !selectedCategory
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                      className={`w-full px-4 py-2.5 text-sm text-left rounded-xl transition-colors flex justify-between items-center ${
                        selectedCategory === cat.slug
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {cat.vendorCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Searching...' : `${vendors.length} results found`}
              </p>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-900 text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-gray-900 text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
              <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <div className="space-y-4">
                {vendors.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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
                      className="block bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                    >
                      <div className="p-6">
                        <div className="flex gap-5">
                          {/* Image */}
                          <div className="w-28 h-28 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {vendor.image ? (
                              <img
                                src={vendor.image}
                                alt={vendor.businessName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-12 h-12 text-purple-300 dark:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {vendor.businessName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                  {vendor.city}, {vendor.state}
                                  {vendor.distance !== null && (
                                    <span className="ml-2 text-purple-600 dark:text-purple-400">
                                      ({vendor.distance.toFixed(1)} mi)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 px-2.5 py-1 rounded-lg">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {formatRating(vendor.averageRating)}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  ({vendor.totalReviews})
                                </span>
                              </div>
                            </div>

                            {vendor.description && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {vendor.description}
                              </p>
                            )}

                            {/* Categories */}
                            {vendor.categories.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {vendor.categories.map((cat) => (
                                  <span
                                    key={cat.id}
                                    className="px-2.5 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg font-medium"
                                  >
                                    {cat.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Services Preview */}
                            {vendor.services.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                                {vendor.services.slice(0, 3).map((service) => (
                                  <span key={service.id} className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                    {service.name} - ${parseFloat(service.price).toFixed(0)}
                                  </span>
                                ))}
                                {vendor.services.length > 3 && (
                                  <span className="text-purple-600 dark:text-purple-400">
                                    +{vendor.services.length - 3} more
                                  </span>
                                )}
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
                  <div className="flex justify-center items-center gap-3 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Map View */
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
