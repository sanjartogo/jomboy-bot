import type { BotContext } from "@/bot/context";
import { createUser, getUserByPhone, linkTelegramToUser, normalizePhone } from "@/db/queries/users";
import { organizationsKeyboard, mainMenuKeyboard } from "@/bot/keyboards";
import { getDirectionShortName } from "@/config/directions";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export async function startCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Allaqachon ro'yxatda bormi?
  if (ctx.user) {
    // ... existing greeting logic ...
    const directionsList = (ctx.user.direction_ids || [])
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
          : ctx.user.role === "nazoratchi"
          ? `Siz nazoratchi sifatida ro'yxatdasiz.\n\nSizga mas'ullar yuborgan barcha hisobotlar kelib tushadi.`
          : `Siz administrator sifatida ro'yxatdasiz.`),
      { reply_markup: mainMenuKeyboard(ctx.user.role) }
    );
    return;
  }

  // AGAR ADMIN YOKI HOKIM BO'LSA - AVTOMATIK RO'YXATDAN O'TKAZISH
  if (env.ADMIN_TELEGRAM_IDS.includes(telegramId) || env.HOKIM_TELEGRAM_ID === telegramId) {
    const role = env.HOKIM_TELEGRAM_ID === telegramId ? "hokim" : "admin";
    const newUser = await createUser({
      telegram_id: telegramId,
      full_name: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
      role: role,
      is_active: true,
      direction_ids: []
    });

    if (newUser) {
      ctx.user = newUser;
      await ctx.reply(
        `Xush kelibsiz, ${role === "hokim" ? "Hokim buva" : "Admin"}! 👋\n\n` +
        `Siz tizimda avtomatik ravishda tanildingiz.`,
        { reply_markup: mainMenuKeyboard(role) }
      );
      return;
    }
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
