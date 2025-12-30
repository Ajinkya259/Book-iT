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

// GET /api/bookings/[id] - Get a specific booking
export async function GET(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true, vendor: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, businessName: true, address: true, city: true, phone: true, email: true } },
        service: { select: { name: true, duration: true, price: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization
    const isVendor = dbUser.vendor?.id === booking.vendorId;
    const isCustomer = dbUser.customer?.id === booking.customerId;

    if (!isVendor && !isCustomer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/bookings/[id] - Update booking status
export async function PUT(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true, vendor: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isVendor = dbUser.vendor?.id === booking.vendorId;
    const isCustomer = dbUser.customer?.id === booking.customerId;

    if (!isVendor && !isCustomer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { status, vendorNotes, cancellationReason } = body;

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    };

    if (status && !allowedTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Only vendors can mark as COMPLETED or NO_SHOW
    if (['COMPLETED', 'NO_SHOW'].includes(status) && !isVendor) {
      return NextResponse.json(
        { error: 'Only vendors can mark bookings as completed or no-show' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = isVendor ? 'VENDOR' : 'CUSTOMER';
        updateData.cancellationReason = cancellationReason || null;
      }
    }

    if (vendorNotes !== undefined && isVendor) {
      updateData.vendorNotes = vendorNotes;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        vendor: { select: { businessName: true } },
        service: { select: { name: true, duration: true, price: true } },
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
