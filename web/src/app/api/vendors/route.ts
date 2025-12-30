import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// GET /api/vendors - Search and list vendors
export async function GET(request: Request) {
  const prisma = createPrisma();

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const city = url.searchParams.get('city');
    const state = url.searchParams.get('state');
    const category = url.searchParams.get('category');
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = parseInt(url.searchParams.get('radius') || '25'); // miles
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Text search on business name or description
    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Location filters
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (state) {
      where.state = { equals: state, mode: 'insensitive' };
    }

    // Category filter
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Get vendors
    let vendors = await prisma.vendor.findMany({
      where,
      include: {
        services: {
          where: { isActive: true, deletedAt: null },
          select: { id: true, name: true, duration: true, price: true },
          take: 3,
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        images: {
          select: { url: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
        { businessName: 'asc' },
      ],
      skip,
      take: limit,
    });

    // If lat/lng provided, filter by distance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      vendors = vendors.filter((vendor) => {
        if (!vendor.latitude || !vendor.longitude) return false;
        const distance = calculateDistance(
          userLat,
          userLng,
          vendor.latitude,
          vendor.longitude
        );
        return distance <= radius;
      });

      // Sort by distance
      vendors.sort((a, b) => {
        const distA = calculateDistance(userLat, userLng, a.latitude!, a.longitude!);
        const distB = calculateDistance(userLat, userLng, b.latitude!, b.longitude!);
        return distA - distB;
      });
    }

    // Get total count for pagination
    const total = await prisma.vendor.count({ where });

    // Format response
    const formattedVendors = vendors.map((vendor) => ({
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      description: vendor.description,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      averageRating: vendor.averageRating,
      totalReviews: vendor.totalReviews,
      image: vendor.images[0]?.url || null,
      services: vendor.services,
      categories: vendor.categories.map((c) => c.category),
      distance: lat && lng && vendor.latitude && vendor.longitude
        ? calculateDistance(parseFloat(lat), parseFloat(lng), vendor.latitude, vendor.longitude)
        : null,
    }));

    return NextResponse.json({
      vendors: formattedVendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Haversine formula to calculate distance between two points in miles
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
