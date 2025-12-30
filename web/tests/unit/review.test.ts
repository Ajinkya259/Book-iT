import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Review CRUD Operations', () => {
  let prisma: PrismaClient;
  let vendorId: string;
  let vendorUserId: string;
  let serviceId: string;
  let customerId: string;
  let customerUserId: string;
  let bookingId: string;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create vendor
    vendorUserId = `review-vendor-${Date.now()}`;
    const vendorUser = await prisma.user.create({
      data: {
        id: vendorUserId,
        email: `review-vendor-${Date.now()}@example.com`,
        role: 'VENDOR',
        vendor: {
          create: {
            businessName: 'Review Test Shop',
            slug: `review-shop-${Date.now()}`,
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
    customerUserId = `review-customer-${Date.now()}`;
    const customerUser = await prisma.user.create({
      data: {
        id: customerUserId,
        email: `review-customer-${Date.now()}@example.com`,
        role: 'CUSTOMER',
        customer: {
          create: {
            name: 'Test Customer',
          },
        },
      },
      include: { customer: true },
    });
    customerId = customerUser.customer!.id;

    // Create completed booking
    const booking = await prisma.booking.create({
      data: {
        vendorId,
        serviceId,
        customerId,
        date: new Date('2025-01-10'),
        startTime: '10:00',
        endTime: '10:30',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'COMPLETED',
      },
    });
    bookingId = booking.id;
  });

  afterEach(async () => {
    await prisma.review.deleteMany({ where: { vendorId } });
    await prisma.booking.deleteMany({ where: { vendorId } });
    await prisma.service.deleteMany({ where: { vendorId } });
    await prisma.vendor.deleteMany({ where: { id: vendorId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.user.deleteMany({ where: { id: { in: [vendorUserId, customerUserId] } } });
  });

  describe('Create Review', () => {
    it('should create a review with rating only', async () => {
      const review = await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 5,
        },
      });

      expect(review.rating).toBe(5);
      expect(review.comment).toBeNull();
    });

    it('should create a review with rating and comment', async () => {
      const review = await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 4,
          comment: 'Great service, would recommend!',
        },
      });

      expect(review.rating).toBe(4);
      expect(review.comment).toBe('Great service, would recommend!');
    });

    it('should enforce one review per booking', async () => {
      await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 5,
        },
      });

      await expect(
        prisma.review.create({
          data: {
            bookingId,
            vendorId,
            customerId,
            rating: 3,
          },
        })
      ).rejects.toThrow();
    });

    it('should accept ratings 1-5', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const newBooking = await prisma.booking.create({
          data: {
            vendorId,
            serviceId,
            customerId,
            date: new Date(`2025-01-${10 + rating}`),
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Test',
            customerEmail: 'test@example.com',
            status: 'COMPLETED',
          },
        });

        const review = await prisma.review.create({
          data: {
            bookingId: newBooking.id,
            vendorId,
            customerId,
            rating,
          },
        });

        expect(review.rating).toBe(rating);
      }
    });
  });

  describe('Read Review', () => {
    beforeEach(async () => {
      await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 5,
          comment: 'Excellent!',
        },
      });
    });

    it('should get review by booking id', async () => {
      const review = await prisma.review.findUnique({
        where: { bookingId },
      });

      expect(review).not.toBeNull();
      expect(review?.rating).toBe(5);
    });

    it('should get review with relations', async () => {
      const review = await prisma.review.findUnique({
        where: { bookingId },
        include: {
          vendor: true,
          customer: true,
          booking: true,
        },
      });

      expect(review?.vendor.businessName).toBe('Review Test Shop');
      expect(review?.customer.name).toBe('Test Customer');
    });

    it('should get all reviews for vendor', async () => {
      // Create more bookings and reviews
      for (let i = 0; i < 3; i++) {
        const b = await prisma.booking.create({
          data: {
            vendorId,
            serviceId,
            customerId,
            date: new Date(`2025-02-${i + 1}`),
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Test',
            customerEmail: 'test@example.com',
            status: 'COMPLETED',
          },
        });

        await prisma.review.create({
          data: {
            bookingId: b.id,
            vendorId,
            customerId,
            rating: 4 + (i % 2),
          },
        });
      }

      const reviews = await prisma.review.findMany({
        where: { vendorId },
      });

      expect(reviews.length).toBe(4);
    });

    it('should calculate average rating', async () => {
      // Create more reviews with different ratings
      const ratings = [5, 4, 4, 5, 3]; // Average = 4.2

      for (let i = 0; i < ratings.length - 1; i++) {
        const b = await prisma.booking.create({
          data: {
            vendorId,
            serviceId,
            customerId,
            date: new Date(`2025-03-${i + 1}`),
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Test',
            customerEmail: 'test@example.com',
            status: 'COMPLETED',
          },
        });

        await prisma.review.create({
          data: {
            bookingId: b.id,
            vendorId,
            customerId,
            rating: ratings[i + 1],
          },
        });
      }

      const result = await prisma.review.aggregate({
        where: { vendorId },
        _avg: { rating: true },
        _count: true,
      });

      expect(result._count).toBe(5);
      expect(result._avg.rating).toBeCloseTo(4.2, 1);
    });
  });

  describe('Update Review', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 4,
          comment: 'Good service',
        },
      });
      reviewId = review.id;
    });

    it('should add vendor response', async () => {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          vendorResponse: 'Thank you for your feedback!',
          respondedAt: new Date(),
        },
      });

      expect(updated.vendorResponse).toBe('Thank you for your feedback!');
      expect(updated.respondedAt).not.toBeNull();
    });

    it('should update comment', async () => {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          comment: 'Updated: Actually it was great!',
          rating: 5,
        },
      });

      expect(updated.comment).toBe('Updated: Actually it was great!');
      expect(updated.rating).toBe(5);
    });
  });

  describe('Delete Review', () => {
    it('should delete a review', async () => {
      const review = await prisma.review.create({
        data: {
          bookingId,
          vendorId,
          customerId,
          rating: 5,
        },
      });

      await prisma.review.delete({ where: { id: review.id } });

      const found = await prisma.review.findUnique({ where: { id: review.id } });
      expect(found).toBeNull();
    });
  });
});
