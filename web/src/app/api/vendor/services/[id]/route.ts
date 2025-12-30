import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vendor/services/[id] - Get a specific service
export async function GET(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor for this user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get the service
    const service = await prisma.service.findFirst({
      where: {
        id,
        vendorId: vendor.id,
        deletedAt: null,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/vendor/services/[id] - Update a service
export async function PUT(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor for this user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if service exists and belongs to this vendor
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        vendorId: vendor.id,
        deletedAt: null,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, duration, price, isActive } = body;

    // Validation
    if (duration !== undefined && (duration < 5 || duration > 480)) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 480 minutes' },
        { status: 400 }
      );
    }

    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/vendor/services/[id] - Soft delete a service
export async function DELETE(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor for this user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if service exists and belongs to this vendor
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        vendorId: vendor.id,
        deletedAt: null,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Soft delete the service
    await prisma.service.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
