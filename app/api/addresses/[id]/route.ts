import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/addresses/[id] - Update address
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, phone, line1, line2, city, state, pincode, isDefault } = body;

    const addressExists = await prisma.address.findUnique({ where: { id } });
    if (!addressExists) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (addressExists.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this address' }, { status: 401 });
    }

    const updatedAddress = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        // Clear previous defaults
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          name,
          phone,
          line1,
          line2,
          city,
          state,
          pincode,
          isDefault,
        },
      });
    });

    return NextResponse.json(updatedAddress);
  } catch (err: any) {
    console.error('Error updating address:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/addresses/[id] - Delete address
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const addressExists = await prisma.address.findUnique({ where: { id } });
    if (!addressExists) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (addressExists.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this address' }, { status: 401 });
    }

    await prisma.address.delete({ where: { id } });

    // If we deleted the default address, make the next available address the default
    if (addressExists.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Address deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting address:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
