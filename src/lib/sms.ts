const SMS_API_URL = process.env.SMS_API_URL || 'https://api.bulksmsbd.net/api/v2';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || '';

/**
 * Normalizes Bangladesh phone number to 8801XXXXXXXXX format
 */
const formatBDPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('01')) return `88${digits}`;
  if (digits.startsWith('1')) return `880${digits}`;
  return digits;
};

/**
 * Sends an SMS message to a Bangladesh mobile number
 */
export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  const formattedPhone = formatBDPhoneNumber(phone);

  if (!SMS_API_KEY) {
    // If SMS credentials are not set, log gracefully without breaking the order flow
    console.log(
      `📱 [SIMULATED SMS to ${formattedPhone}]:\n"${message}"\n(Set SMS_API_KEY in .env to send real SMS)`
    );
    return true;
  }

  try {
    const response = await fetch(`${SMS_API_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: SMS_API_KEY,
        senderId: SMS_SENDER_ID,
        phone: formattedPhone,
        message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return false;
  }
};

/**
 * Pre-formatted transactional SMS triggers
 */
export const SMSTemplates = {
  orderPlaced: (orderCode: string, totalAmount: number) =>
    `RUIL: আপনার অর্ডার #${orderCode} গৃহীত হয়েছে। সর্বমোট: ৳${totalAmount}। লাইব্রেরি থেকে যাচাইয়ের পর ডেলিভারি আপডেট পাবেন।`,

  paymentApproved: (orderCode: string) =>
    `RUIL: আপনার অর্ডার #${orderCode} এর পেমেন্ট ভেরিফাই হয়েছে। পার্সেল প্রস্তুত করা হচ্ছে।`,

  courierShippedWithOTP: (
    orderCode: string,
    courierName: string,
    trackingCode: string,
    otp: string
  ) =>
    `RUIL: আপনার বই ${courierName}-এ পাঠানো হয়েছে (Tracking: ${trackingCode})। ডেলিভারিম্যান আসলে এই OTP কোড দিয়ে পার্সেল বুঝে নিন: ${otp}`,

  orderDelivered: (orderCode: string) =>
    `RUIL: আপনার অর্ডার #${orderCode} সফলভাবে ডেলিভারি হয়েছে। আমাদের লাইব্রেরি ব্যবহারের জন্য ধন্যবাদ!`,
};
