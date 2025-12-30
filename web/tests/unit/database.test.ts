import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

describe('Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    const result = await prisma.$queryRaw<{ test: number }[]>`SELECT 1 as test`;
    expect(result[0].test).toBe(1);
  });

  it('should have all required tables', async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `;

    const tableNames = tables.map((t) => t.tablename);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('vendors');
    expect(tableNames).toContain('customers');
    expect(tableNames).toContain('services');
    expect(tableNames).toContain('bookings');
    expect(tableNames).toContain('reviews');
    expect(tableNames).toContain('availability');
    expect(tableNames).toContain('vendor_exceptions');
    expect(tableNames).toContain('vendor_images');
    expect(tableNames).toContain('categories');
    expect(tableNames).toContain('categories_on_vendors');
  });

  it('should have correct number of tables (11)', async () => {
    const tables = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public';
    `;
    expect(Number(tables[0].count)).toBe(11);
  });
});

describe('Database Schema Validation', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Users Table', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' ORDER BY column_name;
      `;
      const columnNames = columns.map((c) => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have email as unique', async () => {
      const constraints = await prisma.$queryRaw<{ constraint_name: string }[]>`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'UNIQUE';
      `;
      expect(constraints.length).toBeGreaterThan(0);
    });
  });

  describe('Vendors Table', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'vendors' ORDER BY column_name;
      `;
      const columnNames = columns.map((c) => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('businessName');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('address');
      expect(columnNames).toContain('city');
      expect(columnNames).toContain('state');
    });

    it('should have slug as unique', async () => {
      // Check for unique index on slug
      const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
        SELECT indexname FROM pg_indexes WHERE tablename = 'vendors';
      `;
      const indexNames = indexes.map((i) => i.indexname);
      expect(indexNames.some((n) => n.includes('slug'))).toBe(true);
    });
  });

  describe('Customers Table', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'customers' ORDER BY column_name;
      `;
      const columnNames = columns.map((c) => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('phone');
    });
  });

  describe('Services Table', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'services' ORDER BY column_name;
      `;
      const columnNames = columns.map((c) => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('vendorId');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('duration');
      expect(columnNames).toContain('price');
    });
  });

  describe('Bookings Table', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'bookings' ORDER BY column_name;
      `;
      const columnNames = columns.map((c) => c.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('vendorId');
      expect(columnNames).toContain('serviceId');
      expect(columnNames).toContain('customerId');
      expect(columnNames).toContain('date');
      expect(columnNames).toContain('startTime');
      expect(columnNames).toContain('endTime');
      expect(columnNames).toContain('status');
    });
  });
});
