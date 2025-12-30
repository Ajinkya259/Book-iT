import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Check connection
  console.log('1. Testing connection:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  // Test 2: Check auth service
  console.log('\n2. Testing auth service:');
  const { data: session, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.log(`   Auth error: ${authError.message}`);
  } else {
    console.log(`   Auth service: OK (no active session)`);
  }

  // Test 3: Query database via Supabase
  console.log('\n3. Testing database query via Supabase:');
  const { data: categories, error: dbError } = await supabase
    .from('categories')
    .select('*')
    .limit(5);

  if (dbError) {
    console.log(`   Database query error: ${dbError.message}`);
  } else {
    console.log(`   Categories found: ${categories?.length ?? 0}`);
  }

  console.log('\n✅ Supabase tests completed!');
}

main().catch((e) => {
  console.error('❌ Supabase test failed:', e);
  process.exit(1);
});
