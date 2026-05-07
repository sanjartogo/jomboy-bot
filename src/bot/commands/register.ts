import type { BotContext } from "@/bot/context";
import { ORGANIZATIONS } from "@/config/organizations";
import { createUser, linkTelegramToUser } from "@/db/queries/users";
import { logger } from "@/utils/logger";
import { mainMenuKeyboard } from "@/bot/keyboards";
import directionsData from "@/config/directions-data.json";

export async function registerCallbackHandler(ctx: BotContext, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("org_select:")) return next();

  const idx = parseInt(data.replace("org_select:", ""), 10);
  const selectedOrg = ORGANIZATIONS[idx];

  if (!selectedOrg) {
    await ctx.answerCallbackQuery("Xatolik: Tashkilot topilmadi");
    return;
  }

  // Save to session
  ctx.session.registrationOrg = selectedOrg;
  ctx.session.step = "awaiting_name";

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `✅ Siz **${selectedOrg}** tashkilotini tanladingiz.\n\n` +
      `Iltimos, endi o'z ism-familiyangizni kiriting (masalan: Aliyev Vali):`,
    { parse_mode: "Markdown" }
  );
}

export async function registerTextHandler(ctx: BotContext, next: () => Promise<void>) {
  if (ctx.session.step !== "awaiting_name" || !ctx.session.registrationOrg) {
    return next();
  }

  const name = ctx.message?.text?.trim();
  if (!name) {
    await ctx.reply("Iltimos, faqat matn ko'rinishida ism-familiyangizni yuboring.");
    return;
  }

  // Ismni saqlab qolamiz va kontaktni so'raymiz
  ctx.session.registrationName = name;
  ctx.session.step = "awaiting_contact";

  const { shareContactKeyboard } = await import("@/bot/keyboards");
  await ctx.reply(
    `Rahmat, ${name}!\n\n` +
    `Oxirgi qadam: Iltimos, pastdagi tugmani bosib telefon raqamingizni yuboring:`,
    { reply_markup: shareContactKeyboard() }
  );
}

/**
 * Kontakt yuborilganida
 */
export async function registerContactHandler(ctx: BotContext) {
  if (ctx.session.step !== "awaiting_contact" || !ctx.session.registrationOrg || !ctx.session.registrationName) {
    return;
  }

  const contact = ctx.message?.contact;
  if (!contact) {
    await ctx.reply("Iltimos, pastdagi tugmani bosib telefon raqamingizni yuboring.");
    return;
  }

  const name = ctx.session.registrationName;
  const selectedOrg = ctx.session.registrationOrg;
  const telegramId = ctx.from?.id;
  const phone = contact.phone_number;
  
  if (!telegramId) return;

  const { getDirectionsForOrganization } = await import("@/config/directions");
  const assignedDirectionIds = getDirectionsForOrganization(selectedOrg);

  try {
    const { normalizePhone } = await import("@/db/queries/users");
    const newUser = await createUser({
      full_name: name,
      phone: normalizePhone(phone),
      role: "masul",
      organization: selectedOrg,
      direction_ids: assignedDirectionIds,
      is_active: true
    });

    if (newUser) {
      await linkTelegramToUser(newUser.id, telegramId);
      
      // Clear session
      ctx.session.step = undefined;
      ctx.session.registrationOrg = undefined;
      ctx.session.registrationName = undefined;
      ctx.user = { ...newUser, telegram_id: telegramId };

      await ctx.reply(
        `✅ Tabriklaymiz, ${name}!\n\n` +
        `Siz tizimdan muvaffaqiyatli ro'yxatdan o'tdingiz.\n` +
        `Sizga **${assignedDirectionIds.length}** ta yo'nalish biriktirildi.\n\n` +
        `Endi botdan to'liq foydalanishingiz mumkin.`,
        { reply_markup: mainMenuKeyboard(newUser.role) }
      );
    } else {
      await ctx.reply("❌ Ro'yxatdan o'tishda xatolik yuz berdi. Balki bu raqam allaqachon ro'yxatdan o'tgan bo'lishi mumkin.");
    }

  } catch (error) {
    logger.error({ error, telegramId }, "Registration error");
    await ctx.reply("❌ Tizimda xatolik yuz berdi.");
  }
}
