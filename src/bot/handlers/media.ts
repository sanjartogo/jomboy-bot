import type { BotContext } from "@/bot/context";
import { logger } from "@/utils/logger";

export async function mediaHandler(ctx: BotContext) {
  if (!ctx.user) return;

  if (ctx.session.step !== "awaiting_report" || !ctx.session.selectedDirectionId) {
    const { mainMenuKeyboard } = await import("@/bot/keyboards");
    await ctx.reply("Iltimos, avval pastdagi <b>📤 Hisobot yuborish</b> tugmasini bosib, yo'nalishni tanlang!", {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(ctx.user.role)
    });
    return;
  }

  await ctx.reply("⏳ Ma'lumot qabul qilinmoqda...");

  try {
    const { saveAndForwardReport } = await import("./_report-saver");
    await saveAndForwardReport(ctx, "image"); // reuse image logic for general media (copyMessage)
  } catch (err) {
    logger.error({ err, userId: ctx.user.id }, "Media handler failed");
    await ctx.reply(
      "⚠️ Xatolik yuz berdi. Qaytadan yuborib ko'ring yoki matn ko'rinishida yozing."
    );
  }
}
