/**
 * Shift Daily Sync & Reminder Job
 * 1. createDailyShiftLogsFromSchedules:
 *    Runs every day at midnight (and on startup).
 *    Inspects ShifterSchedule for today's day of week.
 *    For each active schedule, checks if a SCHEDULED or ACTIVE ShiftLog already exists for today.
 *    If not, creates a SCHEDULED ShiftLog with today's date & schedule's start/end times.
 *
 * 2. sendShiftReminders:
 *    Runs every 5 minutes.
 *    Finds shifters with SCHEDULED ShiftLog entries starting within the next 15 minutes
 *    who have not yet been sent a reminder (actionToken is null), generates a single-use
 *    action token, saves it to the DB, and dispatches a reminder email with direct
 *    Start / Cancel action links to the frontend /shift-action page.
 */

import crypto from 'crypto';
import { ShiftStatus, UserRole, UserStatus } from '@prisma/client';
import prisma from '../../lib/db';
import sendEmail from './emailSender';
import config from '../config';

const REMINDER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const toWhatsApp = (phone: string) =>
  `https://wa.me/88${phone.replace(/-/g, '')}`;

export const sendShiftReminderEmail = async (params: {
  shifterName: string;
  shifterEmail: string;
  shifterPhone?: string;
  shiftStartTime: Date;
  shiftEndTime?: Date;
  slotName?: string;
  actionToken: string;
  clientUrl: string;
}) => {
  const startFormatted = params.shiftStartTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const startActionUrl = `${params.clientUrl}/shift-action?token=${params.actionToken}&action=START`;
  const cancelActionUrl = `${params.clientUrl}/shift-action?token=${params.actionToken}&action=CANCEL`;

  const phoneSection = params.shifterPhone
    ? `<p style="margin:8px 0 0;font-size:12px;color:#718096;">
         Need help or handover query? Call or WhatsApp: 
         <a href="tel:${params.shifterPhone}" style="color:#16a34a;">${params.shifterPhone}</a>
         &nbsp;·&nbsp;
         <a href="${toWhatsApp(params.shifterPhone)}" style="color:#25D366;">WhatsApp</a>
       </p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color:#004F32;color:white;padding:24px;text-align:center;">
        <h2 style="margin:0;color:#f6ad55;font-size:22px;letter-spacing:0.5px;">RU Islamic Library</h2>
        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Duty Shift Reminder — Starting Soon</p>
      </div>
      <div style="padding:28px;color:#2d3748;line-height:1.6;">
        <p style="font-size:15px;">Assalamu Alaikum <strong>${params.shifterName}</strong>,</p>
        <p style="font-size:14px;">Your scheduled library duty shift at <strong>RU Islamic Library</strong> is starting soon:</p>
        
        <div style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:20px 0;border-radius:6px;">
          <p style="margin:0 0 6px;font-size:14px;"><strong>Shift Slot:</strong> ${params.slotName || 'Counter Duty'}</p>
          <p style="margin:0;font-size:14px;"><strong>Scheduled Time:</strong> ${startFormatted}</p>
        </div>

        <p style="font-size:13px;color:#4a5568;">
          If you are on campus or approaching the desk, you can quickly activate or cancel your shift below — <strong>no password or login required</strong>:
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${startActionUrl}" target="_blank" style="background:#004F32;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block;margin-right:12px;">
            ✅ Start Shift Now
          </a>
          <a href="${cancelActionUrl}" target="_blank" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block;">
            ❌ Cancel Shift
          </a>
        </div>

        <div style="background-color:#fef3c7;border:1px solid #fde68a;padding:12px;border-radius:8px;margin-top:20px;">
          <p style="margin:0;font-size:12px;color:#92400e;">
            💡 <strong>Offline / Connectivity Note:</strong> If you cannot access the internet during your shift, you can simply complete your shift with cash float details later from your dashboard or via an Admin desk.
          </p>
        </div>

        ${phoneSection}

        <p style="margin-top:30px;font-size:12px;color:#a0aec0;border-top:1px solid #edf2f7;padding-top:16px;">
          Jazakallahu Khairan,<br/>
          <strong>RU Islamic Library Operations &amp; Duty Desk</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: params.shifterEmail,
    subject: `[Shift Alert] Your counter duty starts at ${startFormatted} — RU Islamic Library`,
    html,
    text: `Assalamu Alaikum ${params.shifterName}, your shift starts at ${startFormatted}.
Start: ${startActionUrl}
Cancel: ${cancelActionUrl}`,
  });
};

/**
 * Creates today's SCHEDULED ShiftLog entries from recurring ShifterSchedule records
 */
export const syncDailySchedulesToShiftLogs = async () => {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0=Sunday ... 6=Saturday

    // Fetch active recurring schedules for today with eligible active shifters
    const todaySchedules = await prisma.shifterSchedule.findMany({
      where: {
        isActive: true,
        dayOfWeek: currentDayOfWeek,
        shifter: {
          role: { in: [UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
          status: UserStatus.ACTIVE,
        },
      },
      include: {
        shifter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (todaySchedules.length === 0) {
      return;
    }

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    for (const sched of todaySchedules) {
      // Parse schedule startTime (e.g. "15:30" or "03:30 PM")
      let startHours = 15;
      let startMinutes = 30;
      if (sched.startTime) {
        const parts = sched.startTime.split(':');
        if (parts.length >= 2) {
          startHours = parseInt(parts[0], 10) || 15;
          startMinutes = parseInt(parts[1], 10) || 0;
        }
      }

      let endHours = 18;
      let endMinutes = 15;
      if (sched.endTime) {
        const parts = sched.endTime.split(':');
        if (parts.length >= 2) {
          endHours = parseInt(parts[0], 10) || 18;
          endMinutes = parseInt(parts[1], 10) || 15;
        }
      }

      const scheduledStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes, 0);
      const scheduledEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHours, endMinutes, 0);

      // Check if a shift log already exists for this shifter today for this slot
      const existingShift = await prisma.shiftLog.findFirst({
        where: {
          shifterId: sched.shifterId,
          shiftSlotName: sched.slotName || undefined,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!existingShift) {
        await prisma.shiftLog.create({
          data: {
            shifterId: sched.shifterId,
            startTime: scheduledStart,
            endTime: scheduledEnd,
            status: ShiftStatus.SCHEDULED,
            openingCash: 500,
            shiftSlotName: sched.slotName || `${sched.startTime} - ${sched.endTime}`,
            tasksCompleted: `[Roster Slot: ${sched.slotName}]`,
          },
        });
        console.log(
          `[ShiftSync] Created SCHEDULED ShiftLog for ${sched.shifter.name} (${sched.slotName}) on ${sched.dayEn}`
        );
      }
    }
  } catch (err) {
    console.error('[ShiftSync Error]:', err);
  }
};

export const startShiftReminderJob = (baseUrl: string): ReturnType<typeof setInterval> => {
  const clientUrl = config.client_url || 'http://localhost:3000';

  const checkAndNotify = async () => {
    try {
      // 1. Sync daily schedules to ShiftLogs first
      await syncDailySchedulesToShiftLogs();

      const now = new Date();
      const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

      // 2. Find SCHEDULED ShiftLogs starting within next 15 min that haven't been reminded yet
      const upcomingShifts = await prisma.shiftLog.findMany({
        where: {
          status: ShiftStatus.SCHEDULED,
          startTime: { gte: now, lte: windowEnd },
          actionToken: null, // Not yet reminded
          shifter: {
            role: { in: [UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
            status: UserStatus.ACTIVE,
          },
        },
        include: {
          shifter: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      for (const shift of upcomingShifts) {
        const token = crypto.randomBytes(32).toString('hex');

        // Persist token to DB before sending email
        await prisma.shiftLog.update({
          where: { id: shift.id },
          data: { actionToken: token },
        });

        // Send reminder email with client action links
        await sendShiftReminderEmail({
          shifterName: shift.shifter.name,
          shifterEmail: shift.shifter.email,
          shifterPhone: shift.shifter.phone || undefined,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime || undefined,
          slotName: shift.shiftSlotName || undefined,
          actionToken: token,
          clientUrl,
        });

        console.log(
          `[ShiftReminder] ✅ Email dispatched to ${shift.shifter.email} for shift #${shift.id} starting at ${shift.startTime.toISOString()}`
        );
      }
    } catch (err) {
      console.error('[ShiftReminderJob Error]:', err);
    }
  };

  // Run immediately on startup, then every 5 minutes
  checkAndNotify();
  return setInterval(checkAndNotify, 5 * 60 * 1000);
};
