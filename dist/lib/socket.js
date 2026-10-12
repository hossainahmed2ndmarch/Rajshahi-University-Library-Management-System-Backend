"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOrderStatusUpdate = exports.getSocketIO = exports.initSocketIO = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocketIO = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // Allow all client origins or configure to CLIENT_URL
            methods: ['GET', 'POST', 'PATCH'],
        },
    });
    io.on('connection', (socket) => {
        // Client joins room for specific order tracking
        socket.on('join:order', (transactionId) => {
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
exports.initSocketIO = initSocketIO;
const getSocketIO = () => {
    return io;
};
exports.getSocketIO = getSocketIO;
/**
 * Emits real-time order status update to subscribed clients
 */
const emitOrderStatusUpdate = (transactionId, data) => {
    if (io && transactionId) {
        io.to(`order:${transactionId}`).emit('order:status-updated', Object.assign(Object.assign({ transactionId }, data), { timestamp: new Date().toISOString() }));
    }
};
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
