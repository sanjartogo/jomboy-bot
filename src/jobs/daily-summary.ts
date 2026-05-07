import { getReportsByDate, getUsersWhoMissedToday } from "@/db/queries/reports";
import { getActiveMasullar, getAllUsersByRole } from "@/db/queries/users";
import { upsertDailySummary, markSummarySent } from "@/db/queries/summaries";
import { generateDailySummary } from "@/ai/analyzers/daily";
import { todayISO } from "@/utils/date";
import { formatMoney, formatDate } from "@/utils/format";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";
import type { NotificationService } from "@/services/notification";

/**
 * HTML escape (Telegram parse_mode: HTML uchun)
 */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Har kuni 19:00 da ishga tushadi.
 * AI yordamida kunlik xulosa yaratadi va hokimga yuboradi.
 */
export async function dailySummary(notify: NotificationService) {
  logger.info("Daily summary job started");

  const today = todayISO();

  // 1. Ma'lumotlarni yig'ish
  const reports = await getReportsByDate(today);
  const masullar = await getActiveMasullar();
  const missingData = await getUsersWhoMissedToday();

  if (masullar.length === 0) {
    logger.warn("No active masullar found, skipping summary");
    return;
  }

  // 2. AI tahlil
  const analysis = await generateDailySummary({
    date: new Date(),
    reports,
    users: masullar,
    missingData,
  });

  // 3. DB ga saqlash
  await upsertDailySummary({
    summary_date: today,
    reports_submitted: reports.length,
    reports_missing: missingData.length,
    missing_user_ids: missingData.map(m => m.user_id),
    total_identified: analysis.totalIdentified,
    total_collected: analysis.totalCollected,
    top_performers: analysis.topPerformers,
    bottom_performers: analysis.bottomPerformers,
    ai_summary: analysis.summary,
    ai_recommendations: "",
  });

  // 4. Hokimga yuborish uchun xabar tayyorlash (HTML format)
  const uniqueReportedUsers = new Set(reports.map(r => r.user_id)).size;
  const submittedPct = ((uniqueReportedUsers / masullar.length) * 100).toFixed(0);

  const missingNames = masullar
    .filter((u) => missingData.some(m => m.user_id === u.id))
    .slice(0, 6)
    .map((u) => `   • ${esc(u.full_name)}`)
    .join("\n");

  let message = `📊 <b>JOMBOY TUMANI — ${esc(formatDate(new Date()))}</b>\n`;
  message += `${"━".repeat(28)}\n\n`;

  message += `✅ Hisobot berganlar (xodim kesimida): <b>${uniqueReportedUsers}/${masullar.length}</b> (${submittedPct}%)\n`;
  message += `📝 Jami yuborilgan hisobotlar: <b>${reports.length}</b> ta\n`;

  if (missingData.length > 0) {
    message += `❌ Hisobotni qisman yoki to'liq bermaganlar: <b>${missingData.length}</b> ta xodim\n${missingNames}`;
    if (missingData.length > 6) {
      message += `\n   ... va ${missingData.length - 6} ta ko'proq`;
    }
    message += "\n";
  }
  message += "\n";

  message += `💰 <b>Bugungi natija:</b>\n`;
  message += `   Aniqlangan: ${esc(formatMoney(analysis.totalIdentified))}\n`;
  message += `   Undirilgan: ${esc(formatMoney(analysis.totalCollected))}\n`;
  message += `   Qilingan ishlar (XYUS): ${analysis.totalXyus || 0} ta\n\n`;

  if (analysis.topPerformers.length > 0) {
    message += `🟢 <b>ETAKCHILAR:</b>\n`;
    analysis.topPerformers.forEach((p, i) => {
      message += `   ${i + 1}. ${esc(p.full_name)} — ${esc(formatMoney(p.identified_sum))}\n`;
    });
    message += "\n";
  }

  if (analysis.bottomPerformers.length > 0) {
    message += `🔴 <b>EʼTIBOR TALAB:</b>\n`;
    analysis.bottomPerformers.forEach((p) => {
      message += `   • ${esc(p.full_name)} — ${esc(formatMoney(p.identified_sum))}\n`;
    });
    message += "\n";
  }

  if (analysis.summary) {
    message += `💡 <b>AI TAHLILI:</b>\n${esc(analysis.summary)}`;
  }

  // 5. Hokim va adminlarga yuborish
  const recipients: number[] = [env.HOKIM_TELEGRAM_ID, ...env.ADMIN_TELEGRAM_IDS];
  const uniqueRecipients = Array.from(new Set(recipients));

  let delivered = 0;
  for (const tgId of uniqueRecipients) {
    const ok = await notify.send(tgId, message, {
      type: "daily_summary",
      parseMode: "HTML",
    });
    if (ok) delivered++;
  }

  if (delivered > 0) {
    await markSummarySent(today);
  }

  logger.info(
    { delivered, recipients: uniqueRecipients.length },
    "Daily summary sent"
  );
}
