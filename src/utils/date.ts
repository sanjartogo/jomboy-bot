import { format, startOfDay, subDays, addDays } from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function todayStart(): Date {
  return startOfDay(new Date());
}

export function daysAgo(n: number): Date {
  return startOfDay(subDays(new Date(), n));
}

export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Joriy oy raqami (1-12)
 */
export function currentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Oy nomi o'zbekcha
 */
export const MONTHS_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
] as const;

export function monthName(month: number): string {
  return MONTHS_UZ[month - 1] ?? String(month);
}
