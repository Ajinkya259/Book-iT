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

// GET /api/vendors/[vendorId]/slots?date=YYYY-MM-DD&serviceId=xxx
// Returns available time slots for booking
export async function GET(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { vendorId } = await params;

  try {
    const url = new URL(request.url);
    const dateStr = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
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

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();

    // Check for exception on this date
    const exception = await prisma.vendorException.findUnique({
      where: {
        vendorId_date: { vendorId, date },
      },
    });

    if (exception?.isClosed) {
      return NextResponse.json({
        slots: [],
        message: exception.reason || 'Closed on this date'
      });
    }

    // Get availability for this day
    const availability = await prisma.availability.findUnique({
      where: {
        vendorId_dayOfWeek: { vendorId, dayOfWeek },
      },
    });

    // Determine working hours
    let startTime: string;
    let endTime: string;

    if (exception && !exception.isClosed && exception.startTime && exception.endTime) {
      // Use exception hours
      startTime = exception.startTime;
      endTime = exception.endTime;
    } else if (availability?.isActive) {
      // Use regular availability
      startTime = availability.startTime;
      endTime = availability.endTime;
    } else {
      // Vendor not available on this day
      return NextResponse.json({ slots: [], message: 'Not available on this day' });
    }

    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        vendorId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { startTime: true, endTime: true },
    });

    // Generate time slots
    const slots = generateTimeSlots(
      startTime,
      endTime,
      service.duration,
      vendor.bufferMinutes,
      existingBookings
    );

    // Filter out past slots if date is today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const requestedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let availableSlots = slots;
    if (requestedDate.getTime() === today.getTime()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes() + vendor.minLeadTimeHours * 60;
      availableSlots = slots.filter((slot) => {
        const [hours, mins] = slot.startTime.split(':').map(Number);
        return hours * 60 + mins >= currentMinutes;
      });
    }

    return NextResponse.json({
      date: dateStr,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
      },
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
      },
      slots: availableSlots,
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

function generateTimeSlots(
  dayStart: string,
  dayEnd: string,
  serviceDuration: number,
  bufferMinutes: number,
  existingBookings: { startTime: string; endTime: string }[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = serviceDuration + bufferMinutes;

  // Convert times to minutes
  const [startH, startM] = dayStart.split(':').map(Number);
  const [endH, endM] = dayEnd.split(':').map(Number);
  const dayStartMinutes = startH * 60 + startM;
  const dayEndMinutes = endH * 60 + endM;

  // Convert existing bookings to minute ranges
  const bookedRanges = existingBookings.map((b) => {
    const [bStartH, bStartM] = b.startTime.split(':').map(Number);
    const [bEndH, bEndM] = b.endTime.split(':').map(Number);
    return {
      start: bStartH * 60 + bStartM,
      end: bEndH * 60 + bEndM + bufferMinutes, // Add buffer after booking
    };
  });

  // Generate slots in 15-minute increments
  for (let minutes = dayStartMinutes; minutes + serviceDuration <= dayEndMinutes; minutes += 15) {
    const slotEnd = minutes + serviceDuration;

    // Check if slot conflicts with any existing booking
    const hasConflict = bookedRanges.some(
      (range) => !(slotEnd <= range.start || minutes >= range.end)
    );

    if (!hasConflict) {
      slots.push({
        startTime: formatTime(minutes),
        endTime: formatTime(slotEnd),
      });
    }
  }

  return slots;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
