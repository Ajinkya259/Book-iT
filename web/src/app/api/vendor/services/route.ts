import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// GET /api/vendor/services - List all services for the logged-in vendor
export async function GET() {
  const prisma = createPrisma();

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

    // Get all active services for this vendor
    const services = await prisma.service.findMany({
      where: {
        vendorId: vendor.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/vendor/services - Create a new service
export async function POST(request: Request) {
  const prisma = createPrisma();

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

    const body = await request.json();
    const { name, description, duration, price } = body;

    // Validation
    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    if (duration < 5 || duration > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 480 minutes' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        vendorId: vendor.id,
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        currency: vendor.currency,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
