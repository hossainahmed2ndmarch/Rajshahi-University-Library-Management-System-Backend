import nodemailer from 'nodemailer';
import config from '../config';

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
