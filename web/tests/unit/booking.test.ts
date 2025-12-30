import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Booking CRUD Operations', () => {
  let prisma: PrismaClient;
  let vendorId: string;
  let vendorUserId: string;
  let serviceId: string;
  let customerId: string;
  let customerUserId: string;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create vendor
    vendorUserId = `booking-vendor-${Date.now()}`;
    const vendorUser = await prisma.user.create({
      data: {
        id: vendorUserId,
        email: `booking-vendor-${Date.now()}@example.com`,
        role: 'VENDOR',
        vendor: {
          create: {
            businessName: 'Booking Test Shop',
            slug: `booking-shop-${Date.now()}`,
            email: `shop-${Date.now()}@example.com`,
            address: '123 Main St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
          },
        },
      },
      include: { vendor: true },
    });
    vendorId = vendorUser.vendor!.id;

    // Create service
    const service = await prisma.service.create({
      data: {
        vendorId,
        name: 'Haircut',
        duration: 30,
        price: 25.00,
      },
    });
    serviceId = service.id;

    // Create customer
    customerUserId = `booking-customer-${Date.now()}`;
    const customerUser = await prisma.user.create({
      data: {
        id: customerUserId,
        email: `booking-customer-${Date.now()}@example.com`,
        role: 'CUSTOMER',
        customer: {
          create: {
            name: 'Test Customer',
            phone: '+1234567890',
          },
        },
      },
      include: { customer: true },
    });
    customerId = customerUser.customer!.id;
  });

  afterEach(async () => {
    await prisma.booking.deleteMany({ where: { vendorId } });
    await prisma.service.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.user.deleteMany({ where: { id: { in: [vendorUserId, customerUserId] } } });
  });

  describe('Create Booking', () => {
    it('should create a booking with all required fields', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '+1234567890',
        },
      });

      expect(booking.id).toBeDefined();
      expect(booking.status).toBe('CONFIRMED');
      expect(booking.startTime).toBe('10:00');
      expect(booking.endTime).toBe('10:30');
    });

    it('should create booking with PENDING status', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          status: 'PENDING',
        },
      });

      expect(booking.status).toBe('PENDING');
    });

    it('should create booking with customer notes', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerNotes: 'Please be gentle',
        },
      });

      expect(booking.customerNotes).toBe('Please be gentle');
    });
  });

  describe('Read Booking', () => {
    let bookingId: string;

    beforeEach(async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
        },
      });
      bookingId = booking.id;
    });

    it('should get booking by id', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      expect(booking).not.toBeNull();
      expect(booking?.id).toBe(bookingId);
    });

    it('should get booking with relations', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          vendor: true,
          service: true,
          customer: true,
        },
      });

      expect(booking?.vendor.businessName).toBe('Booking Test Shop');
      expect(booking?.service.name).toBe('Haircut');
      expect(booking?.customer.name).toBe('Test Customer');
    });

    it('should get bookings by vendor and date', async () => {
      // Create more bookings
      await prisma.booking.createMany({
        data: [
          {
            vendorId,
            serviceId,
            customerId,
            date: new Date('2025-01-15'),
            startTime: '11:00',
            endTime: '11:30',
            customerName: 'Customer 2',
            customerEmail: 'c2@example.com',
          },
          {
            vendorId,
            serviceId,
            customerId,
            date: new Date('2025-01-16'),
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Customer 3',
            customerEmail: 'c3@example.com',
          },
        ],
      });

      const jan15Bookings = await prisma.booking.findMany({
        where: {
          vendorId,
          date: new Date('2025-01-15'),
        },
      });

      expect(jan15Bookings.length).toBe(2);
    });

    it('should get bookings by status', async () => {
      await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '11:00',
          endTime: '11:30',
          customerName: 'Customer 2',
          customerEmail: 'c2@example.com',
          status: 'CANCELLED',
        },
      });

      const confirmed = await prisma.booking.findMany({
        where: { vendorId, status: 'CONFIRMED' },
      });

      const cancelled = await prisma.booking.findMany({
        where: { vendorId, status: 'CANCELLED' },
      });

      expect(confirmed.length).toBe(1);
      expect(cancelled.length).toBe(1);
    });
  });

  describe('Update Booking', () => {
    let bookingId: string;

    beforeEach(async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
        },
      });
      bookingId = booking.id;
    });

    it('should update booking status to COMPLETED', async () => {
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' },
      });

      expect(updated.status).toBe('COMPLETED');
    });

    it('should cancel booking with reason', async () => {
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'CUSTOMER',
          cancellationReason: 'Cannot make it',
        },
      });

      expect(updated.status).toBe('CANCELLED');
      expect(updated.cancelledAt).not.toBeNull();
      expect(updated.cancellationReason).toBe('Cannot make it');
    });

    it('should add vendor notes', async () => {
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { vendorNotes: 'Regular customer, prefers style A' },
      });

      expect(updated.vendorNotes).toBe('Regular customer, prefers style A');
    });

    it('should mark NO_SHOW', async () => {
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'NO_SHOW' },
      });

      expect(updated.status).toBe('NO_SHOW');
    });
  });

  describe('Booking Status Transitions', () => {
    it('should allow PENDING -> CONFIRMED', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test',
          customerEmail: 'test@example.com',
          status: 'PENDING',
        },
      });

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' },
      });

      expect(updated.status).toBe('CONFIRMED');
    });

    it('should allow CONFIRMED -> COMPLETED', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test',
          customerEmail: 'test@example.com',
          status: 'CONFIRMED',
        },
      });

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      });

      expect(updated.status).toBe('COMPLETED');
    });

    it('should allow CONFIRMED -> CANCELLED', async () => {
      const booking = await prisma.booking.create({
        data: {
          vendorId,
          serviceId,
          customerId,
          date: new Date('2025-01-15'),
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test',
          customerEmail: 'test@example.com',
          status: 'CONFIRMED',
        },
      });

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      expect(updated.status).toBe('CANCELLED');
    });
  });
});
