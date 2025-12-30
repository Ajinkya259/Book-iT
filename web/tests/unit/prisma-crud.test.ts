import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Prisma CRUD Operations', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Category CRUD', () => {
    const testSlug = `test-category-${Date.now()}`;

    afterEach(async () => {
      // Cleanup
      await prisma.category.deleteMany({ where: { slug: { startsWith: 'test-' } } });
    });

    it('should create a category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: testSlug,
          icon: 'test-icon',
        },
      });

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Test Category');
      expect(category.slug).toBe(testSlug);
      expect(category.icon).toBe('test-icon');
    });

    it('should read a category', async () => {
      await prisma.category.create({
        data: { name: 'Test Category', slug: testSlug },
      });

      const category = await prisma.category.findUnique({
        where: { slug: testSlug },
      });

      expect(category).not.toBeNull();
      expect(category?.name).toBe('Test Category');
    });

    it('should update a category', async () => {
      const created = await prisma.category.create({
        data: { name: 'Test Category', slug: testSlug },
      });

      const updated = await prisma.category.update({
        where: { id: created.id },
        data: { name: 'Updated Category' },
      });

      expect(updated.name).toBe('Updated Category');
    });

    it('should delete a category', async () => {
      const created = await prisma.category.create({
        data: { name: 'Test Category', slug: testSlug },
      });

      await prisma.category.delete({ where: { id: created.id } });

      const found = await prisma.category.findUnique({ where: { id: created.id } });
      expect(found).toBeNull();
    });

    it('should enforce unique slug constraint', async () => {
      await prisma.category.create({
        data: { name: 'Test Category 1', slug: testSlug },
      });

      await expect(
        prisma.category.create({
          data: { name: 'Test Category 2', slug: testSlug },
        })
      ).rejects.toThrow();
    });
  });

  describe('User CRUD', () => {
    const testUserId = `test-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;

    afterEach(async () => {
      await prisma.customer.deleteMany({ where: { user: { email: { startsWith: 'test-' } } } });
      await prisma.vendor.deleteMany({ where: { user: { email: { startsWith: 'test-' } } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } });
    });

    it('should create a user with CUSTOMER role', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'CUSTOMER',
        },
      });

      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('CUSTOMER');
    });

    it('should create a user with VENDOR role', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'VENDOR',
        },
      });

      expect(user.role).toBe('VENDOR');
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: { id: testUserId, email: testEmail, role: 'CUSTOMER' },
      });

      await expect(
        prisma.user.create({
          data: { id: `${testUserId}-2`, email: testEmail, role: 'CUSTOMER' },
        })
      ).rejects.toThrow();
    });

    it('should create user with customer profile', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
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

      expect(user.customer).not.toBeNull();
      expect(user.customer?.name).toBe('Test Customer');
      expect(user.customer?.phone).toBe('+1234567890');
    });

    it('should create user with vendor profile', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Business',
              slug: `test-business-${Date.now()}`,
              email: testEmail,
              address: '123 Test St',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
            },
          },
        },
        include: { vendor: true },
      });

      expect(user.vendor).not.toBeNull();
      expect(user.vendor?.businessName).toBe('Test Business');
      expect(user.vendor?.city).toBe('Test City');
    });
  });

  describe('Vendor CRUD', () => {
    let testUserId: string;
    let testEmail: string;

    beforeEach(async () => {
      testUserId = `test-vendor-user-${Date.now()}`;
      testEmail = `vendor-${Date.now()}@example.com`;
    });

    afterEach(async () => {
      await prisma.service.deleteMany({ where: { vendor: { user: { email: { startsWith: 'vendor-' } } } } });
      await prisma.vendor.deleteMany({ where: { user: { email: { startsWith: 'vendor-' } } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: 'vendor-' } } });
    });

    it('should create a vendor with all required fields', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Barber Shop',
              slug: `test-barber-${Date.now()}`,
              email: testEmail,
              address: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94102',
            },
          },
        },
        include: { vendor: true },
      });

      expect(user.vendor?.businessName).toBe('Test Barber Shop');
      expect(user.vendor?.city).toBe('San Francisco');
      expect(user.vendor?.state).toBe('CA');
      expect(user.vendor?.isActive).toBe(true);
      expect(user.vendor?.averageRating).toBe(0);
      expect(user.vendor?.totalReviews).toBe(0);
    });

    it('should update vendor business info', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Original Name',
              slug: `test-vendor-${Date.now()}`,
              email: testEmail,
              address: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94102',
            },
          },
        },
        include: { vendor: true },
      });

      const updated = await prisma.vendor.update({
        where: { id: user.vendor!.id },
        data: {
          businessName: 'Updated Name',
          description: 'A great business',
        },
      });

      expect(updated.businessName).toBe('Updated Name');
      expect(updated.description).toBe('A great business');
    });

    it('should cascade delete vendor when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Business',
              slug: `test-cascade-${Date.now()}`,
              email: testEmail,
              address: '123 Main St',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
            },
          },
        },
        include: { vendor: true },
      });

      const vendorId = user.vendor!.id;

      await prisma.user.delete({ where: { id: testUserId } });

      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      expect(vendor).toBeNull();
    });
  });

  describe('Service CRUD', () => {
    let vendorId: string;
    let testUserId: string;

    beforeEach(async () => {
      testUserId = `service-test-user-${Date.now()}`;
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: `service-test-${Date.now()}@example.com`,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Service Shop',
              slug: `test-service-shop-${Date.now()}`,
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
      await prisma.service.deleteMany({ where: { vendorId } });
      await prisma.vendor.deleteMany({ where: { id: vendorId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    });

    it('should create a service', async () => {
      const service = await prisma.service.create({
        data: {
          vendorId,
          name: 'Haircut',
          description: 'Basic haircut',
          duration: 30,
          price: 25.00,
        },
      });

      expect(service.name).toBe('Haircut');
      expect(service.duration).toBe(30);
      expect(Number(service.price)).toBe(25.00);
      expect(service.isActive).toBe(true);
    });

    it('should create multiple services for a vendor', async () => {
      await prisma.service.createMany({
        data: [
          { vendorId, name: 'Haircut', duration: 30, price: 25.00 },
          { vendorId, name: 'Beard Trim', duration: 15, price: 15.00 },
          { vendorId, name: 'Full Service', duration: 45, price: 40.00 },
        ],
      });

      const services = await prisma.service.findMany({ where: { vendorId } });
      expect(services.length).toBe(3);
    });

    it('should update service price', async () => {
      const service = await prisma.service.create({
        data: {
          vendorId,
          name: 'Haircut',
          duration: 30,
          price: 25.00,
        },
      });

      const updated = await prisma.service.update({
        where: { id: service.id },
        data: { price: 30.00 },
      });

      expect(Number(updated.price)).toBe(30.00);
    });

    it('should soft delete a service', async () => {
      const service = await prisma.service.create({
        data: {
          vendorId,
          name: 'Haircut',
          duration: 30,
          price: 25.00,
        },
      });

      await prisma.service.update({
        where: { id: service.id },
        data: { isActive: false, deletedAt: new Date() },
      });

      const found = await prisma.service.findUnique({ where: { id: service.id } });
      expect(found?.isActive).toBe(false);
      expect(found?.deletedAt).not.toBeNull();
    });
  });
});
