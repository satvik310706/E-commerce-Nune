import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { orderEmitter } from '@/lib/sse';

// GET /api/orders/[id] - Fetch single order details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if the current user owns this order or is Admin
    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 401 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Error fetching order:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update order/payment status (Admin Only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { orderStatus, paymentStatus, notes } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process inventory release if order is cancelled and it was COD (since COD stock was deducted immediately)
    // For online payments, if payment fails/cancels we release stock or if admin cancels confirmed order we release stock.
    const isCancelling = orderStatus === 'CANCELLED' && existingOrder.orderStatus !== 'CANCELLED';
    const isRestoring = orderStatus !== 'CANCELLED' && existingOrder.orderStatus === 'CANCELLED';

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          orderStatus,
          paymentStatus,
          notes,
        },
        include: {
          items: true,
        },
      });

      // Adjust inventory if cancelled
      if (isCancelling) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      } else if (isRestoring) {
        // Dedect inventory back
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return updatedOrder;
    });

    // Broadcast update event via SSE for live customer tracking
    orderEmitter.emit('order-update', {
      orderId: order.id,
      status: order.orderStatus,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Error updating order:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
