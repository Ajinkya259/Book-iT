import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function POST(request: Request) {
  const prisma = createPrisma();

  try {
    const body = await request.json();
    const { userId, email, role, name, phone, businessName, description, address, city, state, postalCode } = body;

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    if (role === 'CUSTOMER') {
      if (!name) {
        return NextResponse.json(
          { error: 'Name is required for customers' },
          { status: 400 }
        );
      }

      // Create user and customer profile
      const user = await prisma.user.create({
        data: {
          id: userId,
          email,
          role: 'CUSTOMER',
          customer: {
            create: {
              name,
              phone: phone || null,
            },
          },
        },
        include: {
          customer: true,
        },
      });

      return NextResponse.json({ user }, { status: 201 });
    }

    if (role === 'VENDOR') {
      if (!businessName || !address || !city || !state || !postalCode) {
        return NextResponse.json(
          { error: 'Business name and address are required for vendors' },
          { status: 400 }
        );
      }

      // Generate unique slug
      let slug = generateSlug(businessName);
      let slugExists = await prisma.vendor.findUnique({ where: { slug } });
      let counter = 1;

      while (slugExists) {
        slug = `${generateSlug(businessName)}-${counter}`;
        slugExists = await prisma.vendor.findUnique({ where: { slug } });
        counter++;
      }

      // Create user and vendor profile
      const user = await prisma.user.create({
        data: {
          id: userId,
          email,
          role: 'VENDOR',
          vendor: {
            create: {
              businessName,
              slug,
              email,
              description: description || null,
              phone: phone || null,
              address,
              city,
              state,
              postalCode,
            },
          },
        },
        include: {
          vendor: true,
        },
      });

      return NextResponse.json({ user }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
