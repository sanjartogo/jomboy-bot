import type { BotContext } from "@/bot/context";
import { getUserByPhone, linkTelegramToUser, normalizePhone } from "@/db/queries/users";
import { organizationsKeyboard, mainMenuKeyboard } from "@/bot/keyboards";
import { getDirectionShortName } from "@/config/directions";
import { logger } from "@/utils/logger";

export async function startCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Allaqachon ro'yxatda bormi?
  if (ctx.user) {
    const directionsList = ctx.user.direction_ids
      .map((id) => `   • №${id} — ${getDirectionShortName(id, 50)}`)
      .join("\n");

    await ctx.reply(
      `Salom, ${ctx.user.full_name}! 👋\n\n` +
        (ctx.user.role === "masul"
          ? `Sizning yo'nalishlaringiz:\n${directionsList}\n\n` +
            `📤 Hisobot yuborish uchun:\n` +
            `• Excel fayl jo'nating\n` +
            `• Akt rasmini jo'nating\n` +
            `• Yoki shunchaki yozing: "3 ta korxona, 12 mln aniqlandi"`
          : ctx.user.role === "hokim"
          ? `Siz tuman hokimi sifatida ro'yxatdasiz.\n\nKuniga 19:00 da avtomatik xulosa keladi.`
          : `Siz administrator sifatida ro'yxatdasiz.`),
      { reply_markup: mainMenuKeyboard(ctx.user.role) }
    );
    return;
  }

  // Ro'yxatda yo'q — tashkilot so'rash
  await ctx.reply(
    `Assalomu alaykum! 👋\n\n` +
      `Bu Jomboy tumani soliq bazasini kengaytirish nazorati boti.\n\n` +
      `Iltimos, o'z tashkilotingizni tanlang:`,
    { reply_markup: organizationsKeyboard() }
  );
}

/**
 * Foydalanuvchi telefon yuborganida
 */
export async function handleContact(ctx: BotContext) {
  // Eski klaviaturani o'chirish va /start ga yo'naltirish
  await ctx.reply(
    "🔄 Bot tizimi yangilandi. Telefon raqam yuborish talab qilinmaydi.\n\n" +
    "Iltimos, /start buyrug'ini bosing yoki yozing.",
    { reply_markup: { remove_keyboard: true } }
  );
}
