import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import sendEmail from "../../utils/emailSender";
import config from "../../config";

/**
 * POST /api/v1/contact
 * Public endpoint – anyone can send a message to the library inbox.
 */
const sendContactEmail = catchAsync(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  const storeEmail = config.email.user;

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f9f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f9f4;padding:32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,79,50,0.1);">
              <tr>
                <td style="background:linear-gradient(135deg,#004F32 0%,#003824 60%,#040D09 100%);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">&#128236; নতুন যোগাযোগ বার্তা</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">RU Islamic Library &mdash; Contact Form</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:0 0 20px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">প্রেরকের নাম</p>
                      <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">${name}</p>
                    </td></tr>
                    <tr><td style="padding:0 0 20px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">ইমেইল ঠিকানা</p>
                      <a href="mailto:${email}" style="margin:0;font-size:15px;color:#004F32;font-weight:700;text-decoration:none;">${email}</a>
                    </td></tr>
                    <tr><td style="padding:0 0 20px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">বিষয়</p>
                      <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">${subject}</p>
                    </td></tr>
                    <tr><td style="padding:0 0 8px;">
                      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">বার্তা</p>
                      <div style="background:#f4f9f4;border-left:4px solid #004F32;border-radius:8px;padding:18px 20px;">
                        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${message}</p>
                      </div>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 36px;">
                  <a href="mailto:${email}?subject=Re: ${subject}" style="display:inline-block;background:#004F32;color:#ffffff;font-weight:800;font-size:13px;padding:12px 24px;border-radius:10px;text-decoration:none;">উত্তর দিন &rarr;</a>
                </td>
              </tr>
              <tr>
                <td style="background:#f4f9f4;padding:20px 40px;border-top:1px solid #e8f4ee;">
                  <p style="margin:0;font-size:11px;color:#999;text-align:center;">
                    এই বার্তাটি RU Islamic Library ওয়েবসাইটের Contact Form থেকে পাঠানো হয়েছে।<br />
                    Rajshahi University, Rajshahi, Bangladesh
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({
    to: storeEmail,
    subject: `[Contact Form] ${subject} — ${name}`,
    html,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "আপনার বার্তা সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই সাড়া দেব।",
    data: null,
  });
});

export const ContactController = {
  sendContactEmail,
};
