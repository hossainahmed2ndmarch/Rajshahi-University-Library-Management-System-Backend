"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRoutes = void 0;
const express_1 = require("express");
const contact_controller_1 = require("./contact.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const contactSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "নাম আবশ্যক").max(100),
        email: zod_1.z.string().email("বৈধ ইমেইল ঠিকানা দিন"),
        subject: zod_1.z.string().min(1, "বিষয় আবশ্যক").max(200),
        message: zod_1.z.string().min(10, "বার্তা কমপক্ষে ১০ অক্ষর হতে হবে").max(2000),
    }),
});
router.post("/", (0, validateRequest_1.default)(contactSchema), contact_controller_1.ContactController.sendContactEmail);
exports.ContactRoutes = router;
