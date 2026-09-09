"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const db_1 = __importDefault(require("./lib/db"));
const node_cron_1 = __importDefault(require("node-cron"));
const borrow_service_1 = require("./app/modules/Borrow/borrow.service");
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Bind to port FIRST or log before connecting
            console.log('Connecting to database...');
            yield db_1.default.$connect();
            console.log('✅ Database connected successfully!');
            // Initialize Overdue Warning Notification Cron Job
            node_cron_1.default.schedule('0 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
                console.log('⏰ [Cron Job] Running automated overdue book audit & notifications...');
                try {
                    const result = yield borrow_service_1.BorrowService.checkOverdueBorrowsAndNotify();
                    console.log(`✅ [Cron Job] Completed overdue audit. ${result.totalChecked} overdue borrow(s) processed.`);
                }
                catch (err) {
                    console.error('❌ [Cron Job Error] Failed to process overdue borrows:', err);
                }
            }));
            // 2. Explicitly pass '0.0.0.0' host binding
            const port = Number(config_1.default.port) || 5000;
            server = app_1.default.listen(port, '0.0.0.0', () => {
                console.log(`🚀 Server is listening on port ${port}`);
            });
        }
        catch (error) {
            console.error('❌ Failed to connect database:', error);
            process.exit(1);
        }
    });
}
main();
process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled Rejection detected, shutting down server...', error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception detected, shutting down server...', error);
    process.exit(1);
});
