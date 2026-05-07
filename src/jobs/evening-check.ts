import { supabase } from "@/db/supabase";
import { getUsersWhoMissedToday } from "@/db/queries/reports";
import { logger } from "@/utils/logger";
import type { NotificationService } from "@/services/notification";

/**
 * Har kuni 18:00 da ishga tushadi.
 * Bugun hisobot bermagan mas'ullarga eslatma yuboradi.
 */
export async function eveningCheck(notify: NotificationService) {
  logger.info("Evening check job started");

  const missingUsers = await getUsersWhoMissedToday();

  if (missingUsers.length === 0) {
    logger.info("All masullar reported today 🎉");
    return;
  }

  let sent = 0;
  for (const user of missingUsers) {
    if (!user.telegram_id) continue;


    const message =
      `⚠️ ${user.full_name}, bugungi hisobotingiz hali kelmadi.\n\n` +
      `Iltimos, soat 19:00 gacha yuboring.\n\n` +
      `Yubormasangiz, ertaga hokim huzurida muhokama qilinadi.`;

    const ok = await notify.send(user.telegram_id, message, {
      type: "missing_report_reminder",
      userId: user.id,
    });

    if (ok) sent++;
  }

  logger.info(
    { missing: missingUsers.length, reminded: sent },
    "Evening check completed"
  );
}

