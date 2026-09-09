import { Server } from 'http';
import app from './app';
import config from './app/config';
import prisma from './lib/db';

import cron from 'node-cron';
import { BorrowService } from './app/modules/Borrow/borrow.service';

let server: Server;

async function main() {
  try {
    // 1. Bind to port FIRST or log before connecting
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    // Initialize Overdue Warning Notification Cron Job
    cron.schedule('0 0 * * *', async () => {
      console.log('⏰ [Cron Job] Running automated overdue book audit & notifications...');
      try {
        const result = await BorrowService.checkOverdueBorrowsAndNotify();
        console.log(`✅ [Cron Job] Completed overdue audit. ${result.totalChecked} overdue borrow(s) processed.`);
      } catch (err) {
        console.error('❌ [Cron Job Error] Failed to process overdue borrows:', err);
      }
    });

    // 2. Explicitly pass '0.0.0.0' host binding
    const port = Number(config.port) || 5000;
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server is listening on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect database:', error);
    process.exit(1);
  }
}

main();

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection detected, shutting down server...', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception detected, shutting down server...', error);
  process.exit(1);
});