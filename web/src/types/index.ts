// Re-export Prisma types
export * from '@prisma/client';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Time slot type
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available?: boolean;
}

// Location type
export interface Location {
  lat: number;
  lng: number;
}

// Search params
export interface SearchParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  query?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'reviews';
  page?: number;
  limit?: number;
}
