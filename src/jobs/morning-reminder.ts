import { getActiveMasullar } from "@/db/queries/users";
import { getDirection } from "@/config/directions";
import { formatMoney } from "@/utils/format";
import { currentMonth, monthName } from "@/utils/date";
import { logger } from "@/utils/logger";
import type { NotificationService } from "@/services/notification";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun",
                    "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Har kuni 09:00 da ishga tushadi.
 * Har bir mas'ulga bugungi yo'nalishlari va rejasi haqida eslatma yuboradi.
 */
export async function morningReminder(notify: NotificationService) {
  logger.info("Morning reminder job started");

  const masullar = await getActiveMasullar();
  const month = currentMonth();
  const monthKey = MONTH_KEYS[month - 1];

  let sent = 0;
  let failed = 0;

  for (const user of masullar) {
    if (!user.telegram_id) {
      logger.debug({ userId: user.id }, "Skipping user without telegram_id");
      continue;
    }

    const directionsList = user.direction_ids
      .map((id) => {
        const d = getDirection(id);
        if (!d) return null;
        const monthlyPlan = d.monthly_plan[monthKey] ?? 0;
        return `📌 №${id} — ${d.name.slice(0, 50)}\n   Reja: ${formatMoney(monthlyPlan)}`;
      })
      .filter(Boolean)
      .join("\n\n");

    if (!directionsList) continue;

    const message =
      `🌅 Xayrli tong, ${user.full_name}!\n\n` +
      `Bugun (${monthName(month)}) sizga quyidagi yo'nalishlar biriktirilgan:\n\n` +
      `${directionsList}\n\n` +
      `📌 Ushbu yo'nalishlar bo'yicha ma'lumot yuborishingiz kerak.\n\n` +
      `📤 Natijani yuborish uchun pastdagi tugmani bosing:`;

    const ok = await notify.send(user.telegram_id, message, {
      type: "morning_reminder",
      userId: user.id,
    });

    if (ok) sent++;
    else failed++;
  }

  logger.info({ sent, failed, total: masullar.length }, "Morning reminder completed");
}
