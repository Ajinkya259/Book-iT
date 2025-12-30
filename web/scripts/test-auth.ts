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

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'testpassword123';

async function main() {
  console.log('Testing Auth Flow...\n');

  // Test 1: Create a test user via Supabase Auth
  console.log('1. Creating test user in Supabase Auth...');
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

  // Test 2: Create customer profile via API simulation
  console.log('\n2. Creating customer profile in database...');
  try {
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: testEmail,
        role: 'CUSTOMER',
        customer: {
          create: {
            name: 'Test Customer',
            phone: '+1234567890',
          },
        },
      },
      include: {
        customer: true,
      },
    });
    console.log(`   Created user: ${user.id}`);
    console.log(`   Created customer: ${user.customer?.name}`);
  } catch (e) {
    console.error('   Failed to create customer:', e);
  }

  // Test 3: Verify user exists
  console.log('\n3. Verifying user in database...');
  const dbUser = await prisma.user.findUnique({
    where: { id: authData.user.id },
    include: { customer: true },
  });
  console.log(`   User found: ${dbUser?.email}`);
  console.log(`   Customer name: ${dbUser?.customer?.name}`);

  // Test 4: Sign in with the user
  console.log('\n4. Testing sign in...');
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
  await prisma.customer.delete({ where: { userId: authData.user.id } });
  await prisma.user.delete({ where: { id: authData.user.id } });
  await supabase.auth.admin.deleteUser(authData.user.id);
  console.log('   Test data cleaned up');

  console.log('\n✅ Auth flow test completed!');
}

main()
  .catch((e) => {
    console.error('❌ Auth test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
