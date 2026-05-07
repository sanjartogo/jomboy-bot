import type { BotContext } from "@/bot/context";
import { logger } from "@/utils/logger";
import axios from "axios";
import { env } from "@/config/env";

export async function photoHandler(ctx: BotContext) {
  if (!ctx.user) return;

  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) return;

  if (ctx.session.step !== "awaiting_report" || !ctx.session.selectedDirectionId) {
    const { mainMenuKeyboard } = await import("@/bot/keyboards");
    await ctx.reply("Iltimos, avval pastdagi <b>📤 Hisobot yuborish</b> tugmasini bosib, yo'nalishni tanlang!", {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(ctx.user.role)
    });
    return;
  }

  // Eng yuqori sifatli versiyani olish
  const photo = photos[photos.length - 1];

  await ctx.reply("⏳ Rasm qabul qilinmoqda...");

  try {
    const { saveAndForwardReport } = await import("./_report-saver");
    await saveAndForwardReport(ctx, "image");
  } catch (err) {
    logger.error({ err, userId: ctx.user.id }, "Photo handler failed");
    await ctx.reply(
      "⚠️ Xatolik yuz berdi. Qaytadan rasm yuboring yoki matn ko'rinishida yozing."
    );
  }
}
