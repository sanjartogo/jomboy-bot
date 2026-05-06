/**
 * Jomboy tumani 38 ta soliq qo'shimcha manba yo'nalishi.
 * Reja summalari mln so'mda (yillik).
 *
 * Manba: "Свод йўналишлар кесимида" Excel jadvali, 30.04.2026 holatiga.
 *
 * MVP uchun viloyat reja raqamlari ishlatilgan. Production uchun
 * Jomboy tumaniga moslashtirilgan raqamlar `seed.ts` orqali yangilanadi.
 */

import directionsData from "./directions-data.json";
import type { Direction } from "@/types";

/**
 * Oylik rejani yillik rejadan teng taqsimlash (oddiy default).
 * Real holatda ba'zi yo'nalishlarda fasllik bor — ularni alohida sozlash kerak.
 */
function distributeMonthly(yearlyPlan: number): Record<string, number> {
  const monthly = yearlyPlan / 12;
  const months = ["jan", "feb", "mar", "apr", "may", "jun",
                  "jul", "aug", "sep", "oct", "nov", "dec"];
  return Object.fromEntries(months.map((m) => [m, Number(monthly.toFixed(2))]));
}

export const DIRECTIONS: Direction[] = directionsData.map((d) => ({
  id: d.id,
  name: d.name,
  responsible_org: null, // Seed paytida to'ldiriladi
  yearly_plan_xyus: 0, // Seed paytida to'ldiriladi
  yearly_plan_sum: d.yearly_plan_sum,
  monthly_plan: distributeMonthly(d.yearly_plan_sum),
}));

export function getDirection(id: number): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}

export function getDirectionShortName(id: number, maxLen = 60): string {
  const d = getDirection(id);
  if (!d) return `№${id}`;
  return d.name.length > maxLen ? d.name.slice(0, maxLen) + "…" : d.name;
}
