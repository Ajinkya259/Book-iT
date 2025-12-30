import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// GET /api/vendor/availability - Get all availability for the logged-in vendor
export async function GET() {
  const prisma = createPrisma();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const availability = await prisma.availability.findMany({
      where: { vendorId: vendor.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/vendor/availability - Create or update availability for a day
export async function POST(request: Request) {
  const prisma = createPrisma();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isActive } = body;

    // Validation
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'Invalid day of week (0-6, Sunday-Saturday)' },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (e.g., 09:00)' },
        { status: 400 }
      );
    }

    // Ensure start time is before end time
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Upsert availability (create or update)
    const availability = await prisma.availability.upsert({
      where: {
        vendorId_dayOfWeek: {
          vendorId: vendor.id,
          dayOfWeek: parseInt(dayOfWeek),
        },
      },
      update: {
        startTime,
        endTime,
        isActive: isActive ?? true,
      },
      create: {
        vendorId: vendor.id,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/vendor/availability - Bulk update availability (all days)
export async function PUT(request: Request) {
  const prisma = createPrisma();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'Schedule must be an array' },
        { status: 400 }
      );
    }

    // Validate and upsert each day
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const results = [];

    for (const day of schedule) {
      const { dayOfWeek, startTime, endTime, isActive } = day;

      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        continue;
      }

      // If not active, we can skip time validation
      if (isActive === false) {
        const result = await prisma.availability.upsert({
          where: {
            vendorId_dayOfWeek: {
              vendorId: vendor.id,
              dayOfWeek: parseInt(dayOfWeek),
            },
          },
          update: { isActive: false },
          create: {
            vendorId: vendor.id,
            dayOfWeek: parseInt(dayOfWeek),
            startTime: '09:00',
            endTime: '17:00',
            isActive: false,
          },
        });
        results.push(result);
        continue;
      }

      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        continue;
      }

      if (startTime >= endTime) {
        continue;
      }

      const result = await prisma.availability.upsert({
        where: {
          vendorId_dayOfWeek: {
            vendorId: vendor.id,
            dayOfWeek: parseInt(dayOfWeek),
          },
        },
        update: {
          startTime,
          endTime,
          isActive: true,
        },
        create: {
          vendorId: vendor.id,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          isActive: true,
        },
      });
      results.push(result);
    }

    return NextResponse.json({ availability: results });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
