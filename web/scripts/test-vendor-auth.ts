import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const testEmail = `vendor-test-${Date.now()}@example.com`;
const testPassword = 'testpassword123';

async function main() {
  console.log('Testing Vendor Auth Flow...\n');

  // Test 1: Create a test vendor user via Supabase Auth
  console.log('1. Creating test vendor in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error('   Failed to create auth user:', authError.message);
    return;
  }
  console.log(`   Created auth user: ${authData.user.id}`);

  // Test 2: Create vendor profile via database
  console.log('\n2. Creating vendor profile in database...');
  try {
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: testEmail,
        role: 'VENDOR',
        vendor: {
          create: {
            businessName: 'Test Barber Shop',
            slug: `test-barber-shop-${Date.now()}`,
            email: testEmail,
            description: 'A test barber shop for testing',
            phone: '+1234567890',
            address: '123 Test Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
          },
        },
      },
      include: {
        vendor: true,
      },
    });
    console.log(`   Created user: ${user.id}`);
    console.log(`   Created vendor: ${user.vendor?.businessName}`);
    console.log(`   Vendor slug: ${user.vendor?.slug}`);
  } catch (e) {
    console.error('   Failed to create vendor:', e);
  }

  // Test 3: Verify vendor exists
  console.log('\n3. Verifying vendor in database...');
  const dbUser = await prisma.user.findUnique({
    where: { id: authData.user.id },
    include: { vendor: true },
  });
  console.log(`   User found: ${dbUser?.email}`);
  console.log(`   Business name: ${dbUser?.vendor?.businessName}`);
  console.log(`   Location: ${dbUser?.vendor?.city}, ${dbUser?.vendor?.state}`);

  // Test 4: Sign in with the vendor
  console.log('\n4. Testing vendor sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('   Sign in failed:', signInError.message);
  } else {
    console.log(`   Sign in successful: ${signInData.user?.email}`);
  }

  // Clean up
  console.log('\n5. Cleaning up test data...');
  await prisma.vendor.delete({ where: { userId: authData.user.id } });
  await prisma.user.delete({ where: { id: authData.user.id } });
  await supabase.auth.admin.deleteUser(authData.user.id);
  console.log('   Test data cleaned up');

  console.log('\n✅ Vendor auth flow test completed!');
}

main()
  .catch((e) => {
    console.error('❌ Vendor auth test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
