import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
config({ path: '.env' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test vendors in Pune, India
const puneVendors = [
  {
    email: 'stylezone@test.com',
    password: 'Test1234!',
    businessName: 'Style Zone Salon',
    description: 'Premium unisex salon offering the latest hair trends, styling, and grooming services in the heart of Koregaon Park.',
    phone: '+91 9876543210',
    address: '45 North Main Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5362,
    longitude: 73.8939,
    categories: ['Hair Salon'],
    services: [
      { name: 'Haircut - Men', duration: 30, price: 300 },
      { name: 'Haircut - Women', duration: 45, price: 500 },
      { name: 'Hair Color', duration: 90, price: 1500 },
      { name: 'Hair Spa', duration: 60, price: 800 },
      { name: 'Beard Trim', duration: 15, price: 150 },
    ],
  },
  {
    email: 'punespa@test.com',
    password: 'Test1234!',
    businessName: 'Tranquil Spa & Wellness',
    description: 'Escape the city stress with our rejuvenating spa treatments. Ayurvedic massages, aromatherapy, and wellness packages.',
    phone: '+91 9876543211',
    address: '12 Boat Club Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5314,
    longitude: 73.8446,
    categories: ['Spa & Wellness'],
    services: [
      { name: 'Swedish Massage', duration: 60, price: 2000 },
      { name: 'Ayurvedic Massage', duration: 90, price: 2500 },
      { name: 'Aromatherapy', duration: 60, price: 1800 },
      { name: 'Body Scrub', duration: 45, price: 1200 },
      { name: 'Facial Treatment', duration: 60, price: 1500 },
    ],
  },
  {
    email: 'fitpune@test.com',
    password: 'Test1234!',
    businessName: 'FitZone Gym & Training',
    description: 'State-of-the-art fitness center with personal training, group classes, and nutrition consultation.',
    phone: '+91 9876543212',
    address: '88 FC Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411004',
    latitude: 18.5287,
    longitude: 73.8411,
    categories: ['Fitness'],
    services: [
      { name: 'Personal Training Session', duration: 60, price: 800 },
      { name: 'Group Fitness Class', duration: 45, price: 300 },
      { name: 'Nutrition Consultation', duration: 30, price: 500 },
      { name: 'Yoga Session', duration: 60, price: 400 },
      { name: 'CrossFit Training', duration: 60, price: 600 },
    ],
  },
  {
    email: 'glownails@test.com',
    password: 'Test1234!',
    businessName: 'Glow Nails Studio',
    description: 'Expert nail care and artistry. Manicures, pedicures, nail extensions, and creative nail art designs.',
    phone: '+91 9876543213',
    address: '23 MG Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5196,
    longitude: 73.8553,
    categories: ['Nail Salon'],
    services: [
      { name: 'Classic Manicure', duration: 30, price: 400 },
      { name: 'Classic Pedicure', duration: 45, price: 500 },
      { name: 'Gel Nails', duration: 60, price: 1000 },
      { name: 'Nail Art', duration: 45, price: 600 },
      { name: 'Nail Extensions', duration: 90, price: 1500 },
    ],
  },
  {
    email: 'pawscare@test.com',
    password: 'Test1234!',
    businessName: 'Paws & Care Pet Grooming',
    description: 'Professional pet grooming services. We treat your furry friends like family with gentle care and expert styling.',
    phone: '+91 9876543214',
    address: '56 Aundh Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411007',
    latitude: 18.5590,
    longitude: 73.8077,
    categories: ['Pet Services'],
    services: [
      { name: 'Dog Bath & Grooming', duration: 60, price: 800 },
      { name: 'Cat Grooming', duration: 45, price: 600 },
      { name: 'Nail Trimming', duration: 15, price: 200 },
      { name: 'Full Grooming Package', duration: 90, price: 1200 },
      { name: 'De-shedding Treatment', duration: 45, price: 500 },
    ],
  },
  {
    email: 'clickstudio@test.com',
    password: 'Test1234!',
    businessName: 'Click Perfect Studio',
    description: 'Professional photography studio for portraits, events, product shoots, and creative photography sessions.',
    phone: '+91 9876543215',
    address: '101 Baner Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411045',
    latitude: 18.5590,
    longitude: 73.7868,
    categories: ['Photography'],
    services: [
      { name: 'Portrait Session', duration: 60, price: 2000 },
      { name: 'Product Photography', duration: 120, price: 5000 },
      { name: 'Event Coverage (per hour)', duration: 60, price: 3000 },
      { name: 'Passport Photos', duration: 15, price: 200 },
      { name: 'Maternity Shoot', duration: 90, price: 4000 },
    ],
  },
  {
    email: 'drsmile@test.com',
    password: 'Test1234!',
    businessName: 'Dr. Smile Dental Clinic',
    description: 'Modern dental care with a gentle touch. Offering general dentistry, cosmetic procedures, and orthodontics.',
    phone: '+91 9876543216',
    address: '78 Karve Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411004',
    latitude: 18.5018,
    longitude: 73.8170,
    categories: ['Dental'],
    services: [
      { name: 'Dental Checkup', duration: 30, price: 500 },
      { name: 'Teeth Cleaning', duration: 45, price: 1000 },
      { name: 'Teeth Whitening', duration: 60, price: 3000 },
      { name: 'Cavity Filling', duration: 45, price: 1500 },
      { name: 'Root Canal', duration: 90, price: 5000 },
    ],
  },
  {
    email: 'royalbarber@test.com',
    password: 'Test1234!',
    businessName: 'Royal Barber Shop',
    description: 'Traditional barbershop with modern techniques. Expert cuts, hot towel shaves, and beard styling for gentlemen.',
    phone: '+91 9876543217',
    address: '34 Camp Area',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    latitude: 18.5122,
    longitude: 73.8803,
    categories: ['Barber Shop'],
    services: [
      { name: 'Classic Haircut', duration: 30, price: 250 },
      { name: 'Hot Towel Shave', duration: 30, price: 200 },
      { name: 'Beard Styling', duration: 20, price: 150 },
      { name: 'Hair + Beard Combo', duration: 45, price: 350 },
      { name: 'Head Massage', duration: 15, price: 100 },
    ],
  },
];

function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedVendors() {
  console.log('Starting to seed Pune vendors...\n');

  for (const vendor of puneVendors) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: vendor.email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipping ${vendor.businessName} - already exists`);
        continue;
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: vendor.email,
        password: vendor.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`❌ Auth error for ${vendor.businessName}:`, authError.message);
        continue;
      }

      const userId = authData.user.id;

      // Get category IDs
      const categoryIds = await Promise.all(
        vendor.categories.map(async (catName) => {
          const cat = await prisma.category.findFirst({
            where: { name: catName },
          });
          return cat?.id;
        })
      );

      const validCategoryIds = categoryIds.filter((id): id is string => id !== undefined);

      // Create user and vendor in database
      const slug = generateSlug(vendor.businessName);

      await prisma.user.create({
        data: {
          id: userId,
          email: vendor.email,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName: vendor.businessName,
              slug,
              description: vendor.description,
              phone: vendor.phone,
              email: vendor.email,
              address: vendor.address,
              city: vendor.city,
              state: vendor.state,
              postalCode: vendor.postalCode,
              country: 'India',
              latitude: vendor.latitude,
              longitude: vendor.longitude,
              currency: 'INR',
              timezone: 'Asia/Kolkata',
              categories: {
                create: validCategoryIds.map((categoryId) => ({
                  category: { connect: { id: categoryId } },
                })),
              },
              services: {
                create: vendor.services.map((service) => ({
                  name: service.name,
                  duration: service.duration,
                  price: service.price,
                  isActive: true,
                })),
              },
              availability: {
                create: [
                  { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isActive: true },
                  { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isActive: true },
                  { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isActive: true },
                  { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isActive: true },
                  { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isActive: true },
                  { dayOfWeek: 6, startTime: '10:00', endTime: '18:00', isActive: true },
                  { dayOfWeek: 0, startTime: '10:00', endTime: '16:00', isActive: false },
                ],
              },
            },
          },
        },
      });

      console.log(`✅ Created: ${vendor.businessName} (${vendor.email})`);
    } catch (error) {
      console.error(`❌ Error creating ${vendor.businessName}:`, error);
    }
  }

  console.log('\n✨ Seeding complete!');
  console.log('\nTest credentials (all use password: Test1234!):');
  puneVendors.forEach((v) => console.log(`  - ${v.email}`));
}

seedVendors()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
