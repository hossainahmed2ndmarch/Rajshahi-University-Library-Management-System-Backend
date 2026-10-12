import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow all client origins or configure to CLIENT_URL
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    // Client joins room for specific order tracking
    socket.on('join:order', (transactionId: string) => {
      if (transactionId) {
        socket.join(`order:${transactionId}`);
      }
    });

    socket.on('disconnect', () => {
      // Cleanly disconnected
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emits real-time order status update to subscribed clients
 */
export const emitOrderStatusUpdate = (transactionId: string, data: Record<string, unknown>) => {
  if (io && transactionId) {
    io.to(`order:${transactionId}`).emit('order:status-updated', {
      transactionId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};
