import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/reviews/[id] - Get a specific review
export async function GET(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
        vendor: { select: { businessName: true } },
        booking: {
          select: {
            service: { select: { name: true } },
            date: true,
          }
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/reviews/[id] - Update review (vendor can respond, customer can edit within 24h)
export async function PUT(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true, vendor: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const body = await request.json();

    // Vendor responding to review
    if (dbUser.vendor && dbUser.vendor.id === review.vendorId) {
      const { vendorResponse } = body;

      if (!vendorResponse) {
        return NextResponse.json({ error: 'Response is required' }, { status: 400 });
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          vendorResponse,
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({ review: updatedReview });
    }

    // Customer editing their review (within 24 hours)
    if (dbUser.customer && dbUser.customer.id === review.customerId) {
      const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation > 24) {
        return NextResponse.json({ error: 'Reviews can only be edited within 24 hours' }, { status: 400 });
      }

      const { rating, comment } = body;

      if (rating && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }

      const updateData: any = {};
      if (rating !== undefined) updateData.rating = rating;
      if (comment !== undefined) updateData.comment = comment;

      const updatedReview = await prisma.review.update({
        where: { id },
        data: updateData,
      });

      // Update vendor's average rating
      if (rating !== undefined) {
        const stats = await prisma.review.aggregate({
          where: { vendorId: review.vendorId },
          _avg: { rating: true },
        });

        await prisma.vendor.update({
          where: { id: review.vendorId },
          data: { averageRating: stats._avg.rating || 0 },
        });
      }

      return NextResponse.json({ review: updatedReview });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/reviews/[id] - Delete review (customer only, within 24h)
export async function DELETE(request: Request, { params }: RouteParams) {
  const prisma = createPrisma();
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.customerId !== customer.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: 'Reviews can only be deleted within 24 hours' }, { status: 400 });
    }

    await prisma.review.delete({ where: { id } });

    // Update vendor's stats
    const stats = await prisma.review.aggregate({
      where: { vendorId: review.vendorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.vendor.update({
      where: { id: review.vendorId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
