import type { BotContext } from "@/bot/context";
import { parseExcel } from "@/ai/parsers/excel";
import { confirmParsedReport } from "@/bot/handlers/_confirm-flow";
import { logger } from "@/utils/logger";
import axios from "axios";
import { env } from "@/config/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function documentHandler(ctx: BotContext) {
  if (!ctx.user) return;

  const doc = ctx.message?.document;
  if (!doc) return;

  if (ctx.session.step !== "awaiting_report" || !ctx.session.selectedDirectionId) {
    const { mainMenuKeyboard } = await import("@/bot/keyboards");
    await ctx.reply("Iltimos, avval pastdagi <b>📤 Hisobot yuborish</b> tugmasini bosib, yo'nalishni tanlang!", {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(ctx.user.role)
    });
    return;
  }

  // Tekshirish
  const fileName = doc.file_name?.toLowerCase() ?? "";
  const isExcel =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    doc.mime_type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    doc.mime_type === "application/vnd.ms-excel";

  if (!isExcel) {
    await ctx.reply(
      "❌ Faqat Excel fayl (.xlsx, .xls) qabul qilaman.\n\n" +
        "Agar sizda boshqa formatdagi hisobot bo'lsa, rasmga olib yuboring."
    );
    return;
  }

  if ((doc.file_size ?? 0) > MAX_FILE_SIZE) {
    await ctx.reply("❌ Fayl juda katta. 5 MB dan kichik fayl yuboring.");
    return;
  }

  await ctx.reply("⏳ Fayl qabul qilinmoqda...");

  try {
    const { saveAndForwardReport } = await import("./_report-saver");
    await saveAndForwardReport(ctx, "excel");
  } catch (err) {
    logger.error({ err, userId: ctx.user.id }, "Document handler failed");
    await ctx.reply(
      "⚠️ Xatolik yuz berdi. Qaytadan yuborib ko'ring yoki matn ko'rinishida yozing."
    );
  }
}
