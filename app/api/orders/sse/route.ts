import { NextRequest } from 'next/server';
import { orderEmitter } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const orderId = searchParams.get('orderId');

  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      // Send initial handshake
      try {
        controller.enqueue(encoder.encode('data: {"connected":true}\n\n'));
      } catch (err) {
        console.error('Initial enqueue failed', err);
      }

      // Handler for new orders (for Admins)
      const onNewOrder = (order: any) => {
        try {
          if (role === 'admin') {
            controller.enqueue(encoder.encode(`event: new-order\ndata: ${JSON.stringify(order)}\n\n`));
          }
        } catch (err) {
          // Stream might have closed
        }
      };

      // Handler for specific order updates (for Tracking)
      const onOrderUpdate = (data: { orderId: string; status: string; updatedAt: string }) => {
        try {
          if (orderId && data.orderId === orderId) {
            controller.enqueue(encoder.encode(`event: order-update\ndata: ${JSON.stringify(data)}\n\n`));
          }
        } catch (err) {
          // Stream might have closed
        }
      };

      // Register listeners
      orderEmitter.on('new-order', onNewOrder);
      orderEmitter.on('order-update', onOrderUpdate);

      // 15-second Heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          clearInterval(heartbeat);
          orderEmitter.off('new-order', onNewOrder);
          orderEmitter.off('order-update', onOrderUpdate);
          try {
            controller.close();
          } catch (clsErr) {}
        }
      }, 15000);

      // Listen for client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        orderEmitter.off('new-order', onNewOrder);
        orderEmitter.off('order-update', onOrderUpdate);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
