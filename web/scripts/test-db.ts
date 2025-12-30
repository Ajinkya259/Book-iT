import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing database connection...\n');

  // Test 1: Check all tables exist
  console.log('1. Checking tables exist:');
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `;
  console.log('   Tables found:', tables.map(t => t.tablename).join(', '));

  // Test 2: Try to count records in each table
  console.log('\n2. Record counts:');
  const userCount = await prisma.user.count();
  const vendorCount = await prisma.vendor.count();
  const customerCount = await prisma.customer.count();
  const serviceCount = await prisma.service.count();
  const bookingCount = await prisma.booking.count();
  const categoryCount = await prisma.category.count();

  console.log(`   Users: ${userCount}`);
  console.log(`   Vendors: ${vendorCount}`);
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Services: ${serviceCount}`);
  console.log(`   Bookings: ${bookingCount}`);
  console.log(`   Categories: ${categoryCount}`);

  // Test 3: Create a test category
  console.log('\n3. Testing write operation:');
  const testCategory = await prisma.category.upsert({
    where: { slug: 'test-category' },
    update: {},
    create: {
      name: 'Test Category',
      slug: 'test-category',
      icon: 'test',
    },
  });
  console.log(`   Created/Found category: ${testCategory.name} (id: ${testCategory.id})`);

  // Test 4: Read it back
  console.log('\n4. Testing read operation:');
  const readCategory = await prisma.category.findUnique({
    where: { slug: 'test-category' },
  });
  console.log(`   Read category: ${readCategory?.name}`);

  // Test 5: Delete the test category
  console.log('\n5. Testing delete operation:');
  await prisma.category.delete({
    where: { slug: 'test-category' },
  });
  console.log('   Deleted test category');

  console.log('\n✅ All database tests passed!');
}

main()
  .catch((e) => {
    console.error('❌ Database test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
