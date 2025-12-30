import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getUserWithProfile() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: true,
        vendor: true,
      },
    });

    return { authUser: user, dbUser };
  } finally {
    await prisma.$disconnect();
  }
}

export async function requireCustomer() {
  const result = await getUserWithProfile();
  if (!result) {
    redirect('/login');
  }

  if (!result.dbUser?.customer) {
    redirect('/register/customer');
  }

  return result;
}

export async function requireVendor() {
  const result = await getUserWithProfile();
  if (!result) {
    redirect('/login');
  }

  if (!result.dbUser?.vendor) {
    redirect('/register/vendor');
  }

  return result;
}
