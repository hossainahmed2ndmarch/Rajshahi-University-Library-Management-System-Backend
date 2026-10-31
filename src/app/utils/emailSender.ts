import nodemailer from 'nodemailer';
import config from '../config';

export const DefaultEmailTemplates = {
  interviewInvitation: {
    subject: 'Invitation for RUDC Membership Interview — Rajshahi University Dawah Club',
    template: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #0f766e; margin: 0;">Rajshahi University Dawah Club (RUDC)</h2>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">In Pursuit of Knowledge, Service & Faith</p>
  </div>
  <p>Assalamu Alaikum wa Rahmatullah <strong>{{name}}</strong>,</p>
  <p>Thank you for expressing your dedication to join the Rajshahi University Dawah Club (RUDC). We are pleased to invite you to attend your membership interview session.</p>
  
  <div style="background-color: #f8fafc; border-left: 4px solid #0f766e; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 4px 0;"><strong>📅 Date:</strong> {{date}}</p>
    <p style="margin: 4px 0;"><strong>⏰ Time:</strong> {{time}}</p>
    <p style="margin: 4px 0;"><strong>📍 Venue / Link:</strong> {{location}}</p>
  </div>

  <p>Please arrive 10 minutes prior to your allocated time. If this is an online interview, ensure your audio and video are working properly.</p>
  <p>{{extraNote}}</p>

  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">
    Barakallahu Feekum,<br>
    <strong>Executive Board</strong><br>
    Rajshahi University Dawah Club (RUDC)
  </p>
</div>
    `,
  },
  overdueNotice: {
    subject: 'Urgent: Overdue Book Notice — RU Islamic Library',
    template: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 8px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #b91c1c; margin: 0;">RU Islamic Library</h2>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Circulation Department</p>
  </div>
  <p>Assalamu Alaikum <strong>{{name}}</strong>,</p>
  <p>This is a polite reminder that the following borrowed book from the RU Islamic Library is currently <strong>overdue</strong>:</p>

  <div style="background-color: #fff1f2; border-left: 4px solid #b91c1c; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 4px 0;"><strong>📖 Book Title:</strong> {{bookTitle}}</p>
    <p style="margin: 4px 0;"><strong>📅 Due Date:</strong> {{dueDate}}</p>
    <p style="margin: 4px 0;"><strong>⚠️ Days Overdue:</strong> {{daysOverdue}}</p>
  </div>

  <p>Kindly return the book to the library shelf during shift hours so other students and researchers may benefit from it.</p>
  <p>If you have already returned this book today, please ignore this notice.</p>

  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">
    Wassalam,<br>
    <strong>Librarian / Shifter Team</strong><br>
    Rajshahi University Islamic Library
  </p>
</div>
    `,
  },
  generalAnnouncement: {
    subject: '{{subject}} — RU Islamic Library & RUDC',
    template: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #0369a1; margin: 0;">RU Islamic Library & Dawah Club</h2>
  </div>
  <p>Assalamu Alaikum <strong>{{name}}</strong>,</p>
  <div style="margin: 20px 0; line-height: 1.6; color: #334155;">
    {{content}}
  </div>
  <p style="margin-top: 32px; font-size: 13px; color: #64748b;">
    Wassalam,<br>
    <strong>Management Team</strong><br>
    Rajshahi University Islamic Library & RUDC
  </p>
</div>
    `,
  },
};

export const compileEmailTemplate = (template: string, vars: Record<string, string>): string => {
  let compiled = template;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiled = compiled.replace(regex, val || '');
  }
  return compiled;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    if (!config.email.user || !config.email.pass) {
      console.warn(`[Email Notification Logged] Recipient: ${to}, Subject: ${subject}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      text: text || '',
      html,
    });

    console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error);
    return false;
  }
};

export default sendEmail;
