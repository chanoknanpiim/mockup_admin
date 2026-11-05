/**
 * Check whether a toilet is currently open based on Thailand Time (Asia/Bangkok: UTC+7).
 * Operating hours: 08:30 - 19:00 daily (ทุกวัน).
 */
export const OPERATING_HOURS_LABEL = '08.30 - 19.00 น.';

export function isCurrentlyOpenInThailand(now?: Date): boolean {
  const date = now || new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    const totalMinutes = hour * 60 + minute;

    // 08:30 = 8 * 60 + 30 = 510 minutes
    // 19:00 = 19 * 60 = 1140 minutes
    return totalMinutes >= 510 && totalMinutes < 1140;
  } catch {
    // Fallback: UTC+7 calculation
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const bkkHours = (utcHours + 7) % 24;
    const totalMinutes = bkkHours * 60 + utcMinutes;
    return totalMinutes >= 510 && totalMinutes < 1140;
  }
}

export function formatToiletStatus(dbStatus: string | null | undefined, compact: boolean = false): string {
  if (dbStatus && dbStatus !== 'ใช้งานได้') {
    return dbStatus;
  }
  const open = isCurrentlyOpenInThailand();
  if (open) {
    return 'เปิด';
  }
  return compact ? 'ปิด' : 'ปิดให้บริการ';
}
