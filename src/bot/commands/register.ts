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

  const selectedOrg = ctx.session.registrationOrg;
  const telegramId = ctx.from?.id;
  
  if (!telegramId) return;

  // Find corresponding directions for this organization
  const assignedDirectionIds = directionsData
    .filter((d: any) => {
      if (!d.organizations) return false;
      return d.organizations.some((org: string) => 
        selectedOrg.includes(org) || org.includes(selectedOrg)
      );
    })
    .map((d: any) => d.id);

  try {
    // Create new user in DB
    // To allow multiple people to register without phone uniqueness issues,
    // we use a dummy phone or just null if DB allows. 
    // Wait, the DB schema has `phone TEXT UNIQUE`. 
    // We can use telegramId as a dummy phone string, e.g. `tg_${telegramId}`
    const dummyPhone = `tg_${telegramId}`;
    
    // Check if a user with this telegramId already linked
    // We actually shouldn't reach here if they are already in DB because /start catches it.
    const newUser = await createUser({
      full_name: name,
      phone: dummyPhone,
      role: "masul",
      direction_ids: assignedDirectionIds,
      is_active: true
    });

    if (newUser) {
      await linkTelegramToUser(newUser.id, telegramId);
      
      // Clear session
      ctx.session.step = undefined;
      ctx.session.registrationOrg = undefined;
      ctx.user = { ...newUser, telegram_id: telegramId };

      await ctx.reply(
        `✅ Tabriklaymiz, ${name}!\n\n` +
        `Siz tizimdan ro'yxatdan o'tdingiz. Sizga **${assignedDirectionIds.length}** ta yo'nalish biriktirildi.\n\n` +
        `Endi "📤 Hisobot yuborish" tugmasi orqali hisobotlaringizni yuborishingiz mumkin.`,
        { reply_markup: mainMenuKeyboard(newUser.role) }
      );
    } else {
      await ctx.reply("❌ Ro'yxatdan o'tishda xatolik yuz berdi.");
    }
  } catch (error) {
    logger.error({ error, telegramId }, "Registration error");
    await ctx.reply("❌ Tizimda xatolik yuz berdi.");
  }
}
