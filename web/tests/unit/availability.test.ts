import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Availability CRUD Operations', () => {
  let prisma: PrismaClient;
  let vendorId: string;
  let testUserId: string;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    testUserId = `avail-test-user-${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `avail-${Date.now()}@example.com`,
        role: 'VENDOR',
        vendor: {
          create: {
            businessName: 'Availability Test Shop',
            slug: `avail-shop-${Date.now()}`,
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
    vendorId = user.vendor!.id;
  });

  afterEach(async () => {
    await prisma.availability.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('Create Availability', () => {
    it('should create availability for a day', async () => {
      const availability = await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      expect(availability.dayOfWeek).toBe(1);
      expect(availability.startTime).toBe('09:00');
      expect(availability.endTime).toBe('17:00');
      expect(availability.isActive).toBe(true);
    });

    it('should create availability for all weekdays', async () => {
      const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri

      for (const day of weekdays) {
        await prisma.availability.create({
          data: {
            vendorId,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
          },
        });
      }

      const availabilities = await prisma.availability.findMany({
        where: { vendorId },
      });

      expect(availabilities.length).toBe(5);
    });

    it('should enforce unique vendor-day constraint', async () => {
      await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      await expect(
        prisma.availability.create({
          data: {
            vendorId,
            dayOfWeek: 1, // Same day
            startTime: '10:00',
            endTime: '18:00',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Availability', () => {
    beforeEach(async () => {
      // Create availability for Mon-Fri
      for (let day = 1; day <= 5; day++) {
        await prisma.availability.create({
          data: {
            vendorId,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
          },
        });
      }
    });

    it('should get availability for specific day', async () => {
      const availability = await prisma.availability.findUnique({
        where: {
          vendorId_dayOfWeek: {
            vendorId,
            dayOfWeek: 1,
          },
        },
      });

      expect(availability).not.toBeNull();
      expect(availability?.dayOfWeek).toBe(1);
    });

    it('should get all availability for vendor', async () => {
      const availabilities = await prisma.availability.findMany({
        where: { vendorId },
        orderBy: { dayOfWeek: 'asc' },
      });

      expect(availabilities.length).toBe(5);
      expect(availabilities[0].dayOfWeek).toBe(1);
      expect(availabilities[4].dayOfWeek).toBe(5);
    });

    it('should get only active availability', async () => {
      // Deactivate one
      await prisma.availability.updateMany({
        where: { vendorId, dayOfWeek: 3 },
        data: { isActive: false },
      });

      const active = await prisma.availability.findMany({
        where: { vendorId, isActive: true },
      });

      expect(active.length).toBe(4);
    });
  });

  describe('Update Availability', () => {
    it('should update time slots', async () => {
      const created = await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      const updated = await prisma.availability.update({
        where: { id: created.id },
        data: {
          startTime: '08:00',
          endTime: '18:00',
        },
      });

      expect(updated.startTime).toBe('08:00');
      expect(updated.endTime).toBe('18:00');
    });

    it('should deactivate availability', async () => {
      const created = await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      const updated = await prisma.availability.update({
        where: { id: created.id },
        data: { isActive: false },
      });

      expect(updated.isActive).toBe(false);
    });
  });

  describe('Delete Availability', () => {
    it('should delete availability', async () => {
      const created = await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      await prisma.availability.delete({ where: { id: created.id } });

      const found = await prisma.availability.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeNull();
    });

    it('should cascade delete when vendor is deleted', async () => {
      await prisma.availability.create({
        data: {
          vendorId,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      // Delete user (which cascades to vendor)
      await prisma.user.delete({ where: { id: testUserId } });

      const availabilities = await prisma.availability.findMany({
        where: { vendorId },
      });

      expect(availabilities.length).toBe(0);
    });
  });
});

describe('Vendor Exception CRUD', () => {
  let prisma: PrismaClient;
  let vendorId: string;
  let testUserId: string;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    testUserId = `exception-test-user-${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `exception-${Date.now()}@example.com`,
        role: 'VENDOR',
        vendor: {
          create: {
            businessName: 'Exception Test Shop',
            slug: `exception-shop-${Date.now()}`,
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
    vendorId = user.vendor!.id;
  });

  afterEach(async () => {
    await prisma.vendorException.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should create a closed day exception', async () => {
    const exception = await prisma.vendorException.create({
      data: {
        vendorId,
        date: new Date('2025-12-25'),
        isClosed: true,
        reason: 'Christmas Day',
      },
    });

    expect(exception.isClosed).toBe(true);
    expect(exception.reason).toBe('Christmas Day');
  });

  it('should create a modified hours exception', async () => {
    const exception = await prisma.vendorException.create({
      data: {
        vendorId,
        date: new Date('2025-12-24'),
        isClosed: false,
        startTime: '09:00',
        endTime: '14:00',
        reason: 'Christmas Eve - closing early',
      },
    });

    expect(exception.isClosed).toBe(false);
    expect(exception.startTime).toBe('09:00');
    expect(exception.endTime).toBe('14:00');
  });

  it('should enforce unique vendor-date constraint', async () => {
    await prisma.vendorException.create({
      data: {
        vendorId,
        date: new Date('2025-12-25'),
        isClosed: true,
      },
    });

    await expect(
      prisma.vendorException.create({
        data: {
          vendorId,
          date: new Date('2025-12-25'),
          isClosed: false,
        },
      })
    ).rejects.toThrow();
  });

  it('should get exceptions for date range', async () => {
    // Create exceptions
    await prisma.vendorException.createMany({
      data: [
        { vendorId, date: new Date('2025-12-24'), isClosed: false, startTime: '09:00', endTime: '14:00' },
        { vendorId, date: new Date('2025-12-25'), isClosed: true },
        { vendorId, date: new Date('2025-12-26'), isClosed: true },
        { vendorId, date: new Date('2025-01-01'), isClosed: true },
      ],
    });

    const decemberExceptions = await prisma.vendorException.findMany({
      where: {
        vendorId,
        date: {
          gte: new Date('2025-12-01'),
          lte: new Date('2025-12-31'),
        },
      },
    });

    expect(decemberExceptions.length).toBe(3);
  });
});
