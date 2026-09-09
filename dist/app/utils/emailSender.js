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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, html, text, }) {
    try {
        if (!config_1.default.email.user || !config_1.default.email.pass) {
            console.warn(`[Email Notification Logged] Recipient: ${to}, Subject: ${subject}`);
            return false;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: config_1.default.email.host,
            port: config_1.default.email.port,
            secure: config_1.default.email.port === 465,
            auth: {
                user: config_1.default.email.user,
                pass: config_1.default.email.pass,
            },
        });
        const info = yield transporter.sendMail({
            from: config_1.default.email.from,
            to,
            subject,
            text: text || '',
            html,
        });
        console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);
        return true;
    }
    catch (error) {
        console.error(`[Email Error] Failed to send email to ${to}:`, error);
        return false;
    }
});
exports.sendEmail = sendEmail;
exports.default = exports.sendEmail;
