export type TCreateSchedule = {
  shifterId: number;
  dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
  dayName: string; // Bengali: শনিবার
  dayEn: string; // English: Saturday
  slot: string; // 'asr_maghrib' | 'maghrib_isha' | 'custom'
  slotName: string; // আসর – মাগরিব
  startTime: string; // '15:30'
  endTime: string; // '18:15'
  isActive?: boolean;
  notes?: string;
};

export type TUpdateSchedule = Partial<TCreateSchedule>;
