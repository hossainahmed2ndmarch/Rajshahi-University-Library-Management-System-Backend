"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./app/config"));
const globalErrorHandler_1 = __importDefault(require("./app/errors/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/errors/notFound"));
const routes_1 = __importDefault(require("./app/routes"));
const app = (0, express_1.default)();
// Allowed origins
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173',
    config_1.default.client_url,
].filter(Boolean);
// Middlewares
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static uploaded media files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Root Route
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'RUIL Backend API Server is running smoothly',
    });
});
// Master Application API Router
app.use('/api/v1', routes_1.default);
// Error Middlewares
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
