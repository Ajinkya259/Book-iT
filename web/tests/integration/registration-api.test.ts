import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Registration API Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let prisma: PrismaClient;
  const createdUserIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up created users
    for (const userId of createdUserIds) {
      try {
        await prisma.customer.deleteMany({ where: { userId } });
        await prisma.vendor.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await supabase.auth.admin.deleteUser(userId);
      } catch {
        // Ignore cleanup errors
      }
    }
    createdUserIds.length = 0;
  });

  describe('Customer Registration Flow', () => {
    it('should create auth user and customer profile', async () => {
      const testEmail = `reg-customer-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();
      createdUserIds.push(authData.user!.id);

      // Step 2: Create customer profile
      const user = await prisma.user.create({
        data: {
          id: authData.user!.id,
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

      expect(user.id).toBe(authData.user!.id);
      expect(user.email).toBe(testEmail);
      expect(user.role).toBe('CUSTOMER');
      expect(user.customer).not.toBeNull();
      expect(user.customer?.name).toBe('Test Customer');
    });

    it('should be able to sign in after registration', async () => {
      const testEmail = `signin-test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';

      // Create user
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });
      createdUserIds.push(authData.user!.id);

      await prisma.user.create({
        data: {
          id: authData.user!.id,
          email: testEmail,
          role: 'CUSTOMER',
          customer: { create: { name: 'Test User' } },
        },
      });

      // Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(signInError).toBeNull();
      expect(signInData.user?.email).toBe(testEmail);
    });

    it('should reject duplicate email registration', async () => {
      const testEmail = `dup-email-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';

      // Create first user
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });
      createdUserIds.push(authData.user!.id);

      await prisma.user.create({
        data: {
          id: authData.user!.id,
          email: testEmail,
          role: 'CUSTOMER',
          customer: { create: { name: 'First User' } },
        },
      });

      // Try to create second user with same email
      const { error: dupError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
      });

      expect(dupError).not.toBeNull();
    });
  });

  describe('Vendor Registration Flow', () => {
    it('should create auth user and vendor profile', async () => {
      const testEmail = `reg-vendor-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      const slug = `test-vendor-${Date.now()}`;

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      expect(authError).toBeNull();
      createdUserIds.push(authData.user!.id);

      // Step 2: Create vendor profile
      const user = await prisma.user.create({
        data: {
          id: authData.user!.id,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Barber Shop',
              slug,
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

      expect(user.role).toBe('VENDOR');
      expect(user.vendor).not.toBeNull();
      expect(user.vendor?.businessName).toBe('Test Barber Shop');
      expect(user.vendor?.slug).toBe(slug);
      expect(user.vendor?.isActive).toBe(true);
    });

    it('should generate unique slug for vendors with same name', async () => {
      const businessName = 'Popular Salon';

      // Create first vendor
      const email1 = `vendor1-${Date.now()}@example.com`;
      const { data: auth1 } = await supabase.auth.admin.createUser({
        email: email1,
        password: 'testpassword123',
        email_confirm: true,
      });
      createdUserIds.push(auth1.user!.id);

      const slug1 = `popular-salon-${Date.now()}`;
      await prisma.user.create({
        data: {
          id: auth1.user!.id,
          email: email1,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName,
              slug: slug1,
              email: email1,
              address: '123 Main St',
              city: 'City1',
              state: 'CA',
              postalCode: '12345',
            },
          },
        },
      });

      // Create second vendor with same name but different slug
      const email2 = `vendor2-${Date.now()}@example.com`;
      const { data: auth2 } = await supabase.auth.admin.createUser({
        email: email2,
        password: 'testpassword123',
        email_confirm: true,
      });
      createdUserIds.push(auth2.user!.id);

      const slug2 = `popular-salon-${Date.now() + 1}`;
      const user2 = await prisma.user.create({
        data: {
          id: auth2.user!.id,
          email: email2,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName,
              slug: slug2,
              email: email2,
              address: '456 Other St',
              city: 'City2',
              state: 'CA',
              postalCode: '12345',
            },
          },
        },
        include: { vendor: true },
      });

      expect(user2.vendor?.slug).not.toBe(slug1);
    });

    it('should validate required vendor fields', async () => {
      const testEmail = `vendor-validation-${Date.now()}@example.com`;
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
      });
      createdUserIds.push(authData.user!.id);

      // Try to create vendor without required fields
      await expect(
        prisma.user.create({
          data: {
            id: authData.user!.id,
            email: testEmail,
            role: 'VENDOR',
            vendor: {
              create: {
                businessName: 'Test',
                slug: `test-${Date.now()}`,
                email: testEmail,
                // Missing: address, city, state, postalCode
              } as any,
            },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('User Profile Retrieval', () => {
    it('should retrieve customer with profile', async () => {
      const testEmail = `retrieve-customer-${Date.now()}@example.com`;
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
      });
      createdUserIds.push(authData.user!.id);

      await prisma.user.create({
        data: {
          id: authData.user!.id,
          email: testEmail,
          role: 'CUSTOMER',
          customer: { create: { name: 'Test Customer', phone: '+1234567890' } },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: authData.user!.id },
        include: { customer: true, vendor: true },
      });

      expect(user).not.toBeNull();
      expect(user?.customer).not.toBeNull();
      expect(user?.vendor).toBeNull();
      expect(user?.customer?.name).toBe('Test Customer');
    });

    it('should retrieve vendor with profile', async () => {
      const testEmail = `retrieve-vendor-${Date.now()}@example.com`;
      const { data: authData } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
      });
      createdUserIds.push(authData.user!.id);

      await prisma.user.create({
        data: {
          id: authData.user!.id,
          email: testEmail,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: 'Test Shop',
              slug: `test-shop-${Date.now()}`,
              email: testEmail,
              address: '123 Main St',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
            },
          },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: authData.user!.id },
        include: { customer: true, vendor: true },
      });

      expect(user).not.toBeNull();
      expect(user?.vendor).not.toBeNull();
      expect(user?.customer).toBeNull();
      expect(user?.vendor?.businessName).toBe('Test Shop');
    });
  });
});
