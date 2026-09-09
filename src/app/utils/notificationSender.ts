import sendEmail from './emailSender';

export interface ISendOverdueAlertPayload {
  userName: string;
  userEmail: string;
  userPhone: string;
  bookTitle: string;
  dueDate: Date | string;
  borrowId: number;
}

export const sendOverdueAlert = async ({
  userName,
  userEmail,
  userPhone,
  bookTitle,
  dueDate,
  borrowId,
}: ISendOverdueAlertPayload) => {
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // 1. Send Overdue Email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #003824; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; color: #f6ad55;">RU Islamic Library</h2>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Overdue Book Warning Notice</p>
      </div>
      <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
        <p>Assalamu Alaikum <strong>${userName}</strong>,</p>
        <p>This is an automated reminder from <strong>RU Islamic Library</strong>. Our records indicate that the book you borrowed has exceeded its return due date:</p>
        
        <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px;"><strong>Book Title:</strong> ${bookTitle}</p>
          <p style="margin: 0 0 6px;"><strong>Borrow ID:</strong> #${borrowId}</p>
          <p style="margin: 0; color: #c53030;"><strong>Due Date:</strong> ${formattedDueDate} (Overdue)</p>
        </div>

        <p>Please return this book immediately to the library counter during active shift hours so fellow members and students can benefit from it.</p>
        <p>If you have already returned the book or need an extension, please contact the shifter on duty.</p>

        <p style="margin-top: 30px; font-size: 13px; color: #718096;">
          Jazakallahu Khair,<br />
          <strong>RU Islamic Library Management</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `[Overdue Notice] Please return "${bookTitle}" - RU Islamic Library`,
    html: emailHtml,
    text: `Assalamu Alaikum ${userName}, the book "${bookTitle}" (Borrow #${borrowId}) was due on ${formattedDueDate}. Please return it to RU Islamic Library immediately.`,
  });

  // 2. Mobile / SMS alert delivery
  console.log(
    `[SMS / Mobile Overdue Alert] Sent to ${userPhone} (${userName}): "Assalamu Alaikum ${userName}, the book '${bookTitle}' borrowed from RU Islamic Library is OVERDUE (Due: ${formattedDueDate}). Please return it to the library counter as soon as possible."`
  );
};

export interface IShiftNotificationPayload {
  shifterName: string;
  shifterEmail?: string;
  shifterPhone?: string;
  shiftStartTime: Date | string;
  shiftEndTime?: Date | string;
  shiftSlotName?: string;
  recipients: Array<{ name: string; email: string; phone?: string; role: string }>;
  notificationMethod?: 'EMAIL' | 'SMS' | 'SOCIAL_MEDIA' | 'ALL';
  reason?: string;
  notes?: string;
}

export const sendShiftScheduleAlert = async (payload: IShiftNotificationPayload) => {
  const {
    shifterName,
    shiftStartTime,
    shiftEndTime,
    shiftSlotName,
    recipients,
    notificationMethod = 'EMAIL',
    notes,
  } = payload;

  const startFormatted = new Date(shiftStartTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatted = shiftEndTime
    ? new Date(shiftEndTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Standard Duration';

  for (const recipient of recipients) {
    if (notificationMethod === 'EMAIL' || notificationMethod === 'ALL') {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #003824; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #f6ad55;">RU Islamic Library</h2>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Advance Duty Shift Schedule Notice</p>
          </div>
          <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
            <p>Assalamu Alaikum <strong>${recipient.name}</strong> (${recipient.role}),</p>
            <p>Shifter <strong>${shifterName}</strong> has scheduled a counter duty shift in advance:</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 6px;"><strong>Duty Shifter:</strong> ${shifterName}</p>
              <p style="margin: 0 0 6px;"><strong>Shift Slot:</strong> ${shiftSlotName || 'Fixed Duty Slot'}</p>
              <p style="margin: 0 0 6px;"><strong>Scheduled Time:</strong> ${startFormatted} – ${endFormatted}</p>
              ${notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>

            <p>This automated alert is sent to coordinate library counter desk coverage among Shifters, Admins, and Super Admins.</p>

            <p style="margin-top: 30px; font-size: 13px; color: #718096;">
              Jazakallahu Khair,<br />
              <strong>RU Islamic Library Duty Desk</strong>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: recipient.email,
        subject: `[Duty Schedule] Shifter ${shifterName} Scheduled Duty on ${startFormatted}`,
        html: emailHtml,
        text: `Assalamu Alaikum ${recipient.name}, Shifter ${shifterName} scheduled duty shift for ${startFormatted} - ${endFormatted} (${shiftSlotName || 'Duty'}).`,
      });
    }

    if (notificationMethod === 'SMS' || notificationMethod === 'ALL') {
      console.log(
        `[SMS / Mobile Shift Schedule Alert] Sent to ${recipient.phone || recipient.email} (${recipient.name}): "RUIL: Shifter ${shifterName} scheduled duty shift on ${startFormatted} - ${endFormatted} (${shiftSlotName || 'Duty Slot'})."`
      );
    }
  }
};

export const sendShiftCancellationAlert = async (payload: IShiftNotificationPayload) => {
  const {
    shifterName,
    shiftStartTime,
    shiftEndTime,
    shiftSlotName,
    recipients,
    notificationMethod = 'EMAIL',
    reason,
  } = payload;

  const startFormatted = new Date(shiftStartTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatted = shiftEndTime
    ? new Date(shiftEndTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  for (const recipient of recipients) {
    if (notificationMethod === 'EMAIL' || notificationMethod === 'ALL') {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #991b1b; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #fed7aa;">RU Islamic Library</h2>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Advance Duty Shift Cancellation Alert</p>
          </div>
          <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
            <p>Assalamu Alaikum <strong>${recipient.name}</strong> (${recipient.role}),</p>
            <p>Shifter <strong>${shifterName}</strong> has cancelled their scheduled counter duty shift in advance:</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 6px;"><strong>Cancelled Shift:</strong> ${shiftSlotName || 'Duty Slot'} (${startFormatted} ${endFormatted ? `– ${endFormatted}` : ''})</p>
              <p style="margin: 0 0 6px;"><strong>Duty Shifter:</strong> ${shifterName}</p>
              <p style="margin: 0; color: #991b1b;"><strong>Cancellation Reason:</strong> ${reason || 'Not specified'}</p>
            </div>

            <p style="color: #b91c1c; font-weight: bold;">
              Please arrange alternate shifter desk coverage if counter duty is required during this period.
            </p>

            <p style="margin-top: 30px; font-size: 13px; color: #718096;">
              Jazakallahu Khair,<br />
              <strong>RU Islamic Library Duty Desk</strong>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: recipient.email,
        subject: `[Shift Cancelled] Shifter ${shifterName} Cancelled Duty for ${startFormatted}`,
        html: emailHtml,
        text: `Assalamu Alaikum ${recipient.name}, Shifter ${shifterName} has cancelled duty shift on ${startFormatted}. Reason: ${reason || 'Emergency'}. Alternate coverage needed.`,
      });
    }

    if (notificationMethod === 'SMS' || notificationMethod === 'ALL') {
      console.log(
        `[SMS / Mobile Shift Cancellation Alert] Sent to ${recipient.phone || recipient.email} (${recipient.name}): "RUIL ALERT: Shifter ${shifterName} CANCELLED duty on ${startFormatted}. Reason: ${reason || 'Advance notice'}. Please arrange replacement."`
      );
    }
  }
};

export interface ISendMembershipNoticePayload {
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  expiryDate?: Date | string | null;
  status?: string;
}

export const sendMembershipNoticeAlert = async (payload: ISendMembershipNoticePayload) => {
  const { userName, userEmail, subject, message, expiryDate, status } = payload;

  const expiryFormatted = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not Set / Expired';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #003824; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; color: #f6ad55;">RU Islamic Library</h2>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Official Membership Notice</p>
      </div>
      <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
        <p>Assalamu Alaikum <strong>${userName}</strong>,</p>
        <p>This is an official administrative notice from <strong>Rajshahi University Islamic Library</strong> regarding your library membership account.</p>
        
        <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px;"><strong>Account Status:</strong> ${status || 'INACTIVE / EXPIRED'}</p>
          <p style="margin: 0 0 6px;"><strong>Membership Validity:</strong> ${expiryFormatted}</p>
          <p style="margin: 0; color: #854d0e;"><strong>Notice Message:</strong></p>
          <p style="margin: 6px 0 0; font-style: italic;">${message}</p>
        </div>

        <p>If you wish to retain your active borrowing privileges and keep your account in good standing, please visit the library counter desk or log in to renew your membership (৳100 / 6 months).</p>
        <p>Accounts that remain inactive or expired without renewal may be scheduled for permanent removal in future registry audits.</p>

        <p style="margin-top: 30px; font-size: 13px; color: #718096;">
          Jazakallahu Khair,<br />
          <strong>RU Islamic Library Super Administration</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: subject || `[Important Notice] RU Islamic Library Membership Account Status`,
    html: emailHtml,
    text: `Assalamu Alaikum ${userName}, notice regarding your RU Islamic Library account: ${message}. Membership expiry: ${expiryFormatted}. Please renew your membership or contact administration.`,
  });
};

