import { Router } from "express";
import { ContactController } from "./contact.controller";
import validateRequest from "../../middlewares/validateRequest";
import { z } from "zod";

const router = Router();

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(1, "নাম আবশ্যক").max(100),
    email: z.string().email("বৈধ ইমেইল ঠিকানা দিন"),
    subject: z.string().min(1, "বিষয় আবশ্যক").max(200),
    message: z.string().min(10, "বার্তা কমপক্ষে ১০ অক্ষর হতে হবে").max(2000),
  }),
});

router.post("/", validateRequest(contactSchema), ContactController.sendContactEmail);

export const ContactRoutes = router;
