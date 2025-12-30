import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// GET /api/vendor/exceptions - Get all exceptions for the logged-in vendor
export async function GET(request: Request) {
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

    // Get query params for date range
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const whereClause: {
      vendorId: string;
      date?: { gte?: Date; lte?: Date };
    } = { vendorId: vendor.id };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const exceptions = await prisma.vendorException.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ exceptions });
  } catch (error) {
    console.error('Error fetching exceptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/vendor/exceptions - Create a new exception
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
    const { date, isClosed, startTime, endTime, reason } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const exceptionDate = new Date(date);
    if (isNaN(exceptionDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // If not closed, validate times
    if (!isClosed) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!startTime || !endTime) {
        return NextResponse.json(
          { error: 'Start and end times required for modified hours' },
          { status: 400 }
        );
      }
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (startTime >= endTime) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    // Upsert exception
    const exception = await prisma.vendorException.upsert({
      where: {
        vendorId_date: {
          vendorId: vendor.id,
          date: exceptionDate,
        },
      },
      update: {
        isClosed: isClosed ?? true,
        startTime: isClosed ? null : startTime,
        endTime: isClosed ? null : endTime,
        reason: reason || null,
      },
      create: {
        vendorId: vendor.id,
        date: exceptionDate,
        isClosed: isClosed ?? true,
        startTime: isClosed ? null : startTime,
        endTime: isClosed ? null : endTime,
        reason: reason || null,
      },
    });

    return NextResponse.json({ exception }, { status: 201 });
  } catch (error) {
    console.error('Error creating exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/vendor/exceptions - Delete an exception
export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const exceptionDate = new Date(date);

    await prisma.vendorException.delete({
      where: {
        vendorId_date: {
          vendorId: vendor.id,
          date: exceptionDate,
        },
      },
    });

    return NextResponse.json({ message: 'Exception deleted successfully' });
  } catch (error) {
    console.error('Error deleting exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
