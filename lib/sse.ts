import { EventEmitter } from 'events';

class OrderEventEmitter extends EventEmitter {}

// Global instance to survive hot-reloading in Next.js development
const globalForSSE = global as unknown as { orderEmitter: OrderEventEmitter };

export const orderEmitter = globalForSSE.orderEmitter || new OrderEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.orderEmitter = orderEmitter;
}

orderEmitter.setMaxListeners(200);
