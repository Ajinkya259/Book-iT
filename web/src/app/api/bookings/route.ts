import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { sendBookingConfirmation, sendVendorNewBookingNotification } from '@/lib/email';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// GET /api/bookings - Get bookings for the logged-in user (customer or vendor)
export async function GET(request: Request) {
  const prisma = createPrisma();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with profile
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true, vendor: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let bookings;

    if (dbUser.role === 'VENDOR' && dbUser.vendor) {
      // Vendor: get bookings for their business
      bookings = await prisma.booking.findMany({
        where: {
          vendorId: dbUser.vendor.id,
          ...(status && { status: status as any }),
          ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
          ...(dateTo && { date: { lte: new Date(dateTo) } }),
        },
        include: {
          service: { select: { name: true, duration: true, price: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
    } else if (dbUser.role === 'CUSTOMER' && dbUser.customer) {
      // Customer: get their bookings
      bookings = await prisma.booking.findMany({
        where: {
          customerId: dbUser.customer.id,
          ...(status && { status: status as any }),
        },
        include: {
          vendor: { select: { businessName: true, address: true, city: true, phone: true, slug: true } },
          service: { select: { name: true, duration: true, price: true } },
          review: { select: { id: true, rating: true } },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      });
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/bookings - Create a new booking (customer only)
export async function POST(request: Request) {
  const prisma = createPrisma();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { vendorId, serviceId, date, startTime, customerNotes } = body;

    // Validation
    if (!vendorId || !serviceId || !date || !startTime) {
      return NextResponse.json(
        { error: 'Vendor, service, date, and start time are required' },
        { status: 400 }
      );
    }

    // Get vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor || !vendor.isActive) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get service
    const service = await prisma.service.findFirst({
      where: { id: serviceId, vendorId, isActive: true, deletedAt: null },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate end time
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + service.duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    const bookingDate = new Date(date);

    // Check for conflicts
    const existingBooking = await prisma.booking.findFirst({
      where: {
        vendorId,
        date: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        vendorId,
        serviceId,
        customerId: customer.id,
        date: bookingDate,
        startTime,
        endTime,
        status: 'CONFIRMED', // Auto-confirm for now
        customerName: customer.name,
        customerEmail: user.email!,
        customerPhone: customer.phone,
        customerNotes: customerNotes || null,
      },
      include: {
        vendor: { select: { businessName: true, address: true, city: true, phone: true, email: true } },
        service: { select: { name: true, duration: true, price: true } },
      },
    });

    // Format time for email
    const formatTime = (time: string) => {
      const [hours, mins] = time.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };

    // Send confirmation emails (non-blocking)
    Promise.all([
      sendBookingConfirmation({
        customerName: customer.name,
        customerEmail: user.email!,
        vendorName: booking.vendor.businessName,
        serviceName: booking.service.name,
        date: date,
        time: formatTime(startTime),
        price: booking.service.price.toString(),
        vendorAddress: booking.vendor.address,
        vendorCity: booking.vendor.city,
        vendorPhone: booking.vendor.phone || undefined,
      }),
      booking.vendor.email && sendVendorNewBookingNotification({
        vendorEmail: booking.vendor.email,
        vendorName: booking.vendor.businessName,
        customerName: customer.name,
        serviceName: booking.service.name,
        date: date,
        time: formatTime(startTime),
      }),
    ]).catch(console.error);

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
