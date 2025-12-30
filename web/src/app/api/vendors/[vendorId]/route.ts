import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

interface RouteParams {
  params: Promise<{ vendorId: string }>;
}

// GET /api/vendors/[vendorId] - Get vendor by ID or slug
export async function GET(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { vendorId } = await params;

  try {
    // Try to find by slug first, then by ID
    let vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { slug: vendorId },
          { id: vendorId },
        ],
        isActive: true,
      },
      include: {
        services: {
          where: { isActive: true, deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        description: vendor.description,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        phone: vendor.phone,
        email: vendor.email,
        services: vendor.services,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
