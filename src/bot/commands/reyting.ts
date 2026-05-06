import type { BotContext } from "@/bot/context";
import { supabase } from "@/db/supabase";
import { getUserReportsLastDays } from "@/db/queries/reports";
import { formatMoney, formatPercent } from "@/utils/format";
import { logger } from "@/utils/logger";

export async function reytingCommand(ctx: BotContext) {
  if (!ctx.user || ctx.user.role !== "masul") {
    await ctx.reply("Bu komanda faqat mas'ullar uchun.");
    return;
  }

  // Oxirgi 7 kun
  const userReports = await getUserReportsLastDays(ctx.user.id, 7);

  // Barcha masullarning oxirgi 7 kunlik natijasini olish
  const { data: allReports, error } = await supabase
    .from("reports")
    .select("user_id, identified_sum, users!inner(full_name, role)")
    .gte("report_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .eq("users.role", "masul");

  if (error) {
    logger.error({ error }, "Failed to get all reports for ranking");
    await ctx.reply("⚠️ Reytingni hisoblashda xatolik. Qaytadan urinib ko'ring.");
    return;
  }

  // User bo'yicha guruhlash
  const userTotals = new Map<string, { name: string; sum: number }>();
  for (const r of allReports ?? []) {
    const userId = r.user_id;
    const name = (r.users as any).full_name;
    const existing = userTotals.get(userId) ?? { name, sum: 0 };
    existing.sum += Number(r.identified_sum) || 0;
    userTotals.set(userId, existing);
  }

  const ranking = Array.from(userTotals.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.sum - a.sum);

  const myRank = ranking.findIndex((r) => r.id === ctx.user!.id) + 1;
  const totalUsers = ranking.length;

  const myTotal = userReports.reduce((s, r) => s + (r.identified_sum ?? 0), 0);
  const reportingDays = new Set(userReports.map((r) => r.report_date)).size;

  let message = `🏆 *Sizning reytingingiz \\(oxirgi 7 kun\\)*\n\n`;
  message += `Joyingiz: *${myRank}/${totalUsers || "?"}*\n\n`;
  message += `📊 Ko'rsatkichlaringiz:\n`;
  message += `• Hisobot kunlari: ${reportingDays}/7\n`;
  message += `• Aniqlangan: ${escapeMd(formatMoney(myTotal))}\n\n`;

  // Top 5
  message += `🥇 *ENG YAXSHI 5 MAS'UL:*\n`;
  ranking.slice(0, 5).forEach((r, i) => {
    const isMe = r.id === ctx.user!.id;
    const medal = ["🥇", "🥈", "🥉", "🏅", "🏅"][i];
    const name = isMe ? `*${escapeMd(r.name)} \\(SIZ\\)*` : escapeMd(r.name);
    message += `${medal} ${name} — ${escapeMd(formatMoney(r.sum))}\n`;
  });

  if (myRank > 5) {
    message += `\n\\.\\.\\.\n${myRank}\\. *${escapeMd(ctx.user.full_name)} \\(SIZ\\)* — ${escapeMd(formatMoney(myTotal))}\n`;
  }

  await ctx.reply(message, { parse_mode: "MarkdownV2" });
}

function escapeMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
