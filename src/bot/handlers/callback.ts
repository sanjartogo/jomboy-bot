import type { BotContext } from "@/bot/context";
import { upsertReport } from "@/db/queries/reports";
import { todayISO } from "@/utils/date";
import { logger } from "@/utils/logger";
import { mainMenuKeyboard } from "@/bot/keyboards";

export async function callbackHandler(ctx: BotContext) {
  if (!ctx.user) {
    await ctx.answerCallbackQuery("Avval /start bilan ro'yxatdan o'ting");
    return;
  }

  const data = ctx.callbackQuery?.data;
  if (!data) return;

  if (data.startsWith("report_dir:")) {
    await handleReportDir(ctx, data.slice("report_dir:".length));
  } else {
    await ctx.answerCallbackQuery("Noma'lum tugma");
  }
}



async function handleReportDir(ctx: BotContext, value: string) {
  await ctx.answerCallbackQuery();
  const dirId = Number(value);
  if (isNaN(dirId)) return;
  
  ctx.session.selectedDirectionId = dirId;
  ctx.session.step = "awaiting_report";
  
  const { getDirection } = await import("@/config/directions");
  const dir = getDirection(dirId);
  const rawName = dir?.name || `№${dirId}`;
  const dirName = String(rawName).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  try {
    await ctx.editMessageText(`✅ <b>Siz quyidagi yo'nalishni tanladingiz:</b>\n📌 ${dirName}\n\n📤 <b>Endi qilingan ishlar hisobotini yuboring:</b>\n- Matn orqali batafsil yozib;\n- Akt yoki dalil rasmini tashlab;\n- Yoki Excel shaklida yuborishingiz mumkin.`, { parse_mode: "HTML" });
  } catch (e) {
    logger.error({ err: e }, "Failed to edit message in handleReportDir");
  }
}
