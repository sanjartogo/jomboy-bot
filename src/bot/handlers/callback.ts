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
  } else if (data.startsWith("review_report:")) {
    await handleReviewReport(ctx, data.slice("review_report:".length));
  } else if (data.startsWith("add_role:")) {
    await handleAddRole(ctx, data.slice("add_role:".length));
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

async function handleReviewReport(ctx: BotContext, reportId: string) {
  const { updateReportStatus } = await import("@/db/queries/reports");
  
  const ok = await updateReportStatus(reportId, "reviewed");
  
  if (ok) {
    await ctx.answerCallbackQuery("✅ Hisobot ko'rib chiqildi deb belgilandi.");
    try {
        const oldText = ctx.callbackQuery?.message?.caption || ctx.callbackQuery?.message?.text || "";
        const newText = `${oldText}\n\n✅ <b>Ko'rib chiqildi:</b> ${ctx.user?.full_name}`;
        
        if (ctx.callbackQuery?.message?.caption) {
            await ctx.editMessageCaption({ caption: newText, parse_mode: "HTML", reply_markup: undefined });
        } else {
            await ctx.editMessageText(newText, { parse_mode: "HTML", reply_markup: undefined });
        }
    } catch (e) {
        logger.error({ err: e }, "Failed to update message after review");
    }
  } else {
    await ctx.answerCallbackQuery("❌ Xatolik yuz berdi.");
  }
}

async function handleAddRole(ctx: BotContext, role: string) {
  if (!ctx.session.newUserName || !ctx.session.newUserId) {
    await ctx.answerCallbackQuery("Xatolik: Ma'lumotlar yetarli emas.");
    return;
  }

  const { getUserByPhone, createUser, linkTelegramToUser } = await import("@/db/queries/users");
  const tempPhone = `tg_${ctx.session.newUserId}`;
  
  try {
    // 1. Avval tekshiramiz
    const existingUser = await getUserByPhone(tempPhone);
    if (existingUser) {
      await ctx.editMessageText(`⚠️ <b>Xatolik:</b> Bu xodim (ID: ${ctx.session.newUserId}) allaqachon tizimda mavjud.`, { parse_mode: "HTML" });
      
      await ctx.reply("Asosiy menyuga qaytdingiz:", {
        reply_markup: mainMenuKeyboard(ctx.user!.role)
      });
      return;
    }

    // 2. Qo'shish
    const newUser = await createUser({
      full_name: ctx.session.newUserName,
      phone: tempPhone, 
      role: role as any,
      direction_ids: [],
      is_active: true
    });

    if (newUser) {
      await linkTelegramToUser(newUser.id, ctx.session.newUserId);
      await ctx.editMessageText(`✅ <b>Muvaffaqiyatli qo'shildi!</b>\n\n👤 Ism: ${ctx.session.newUserName}\n🏢 Rol: ${role}\n🆔 ID: ${ctx.session.newUserId}`, { parse_mode: "HTML" });
      
      try {
          await ctx.api.sendMessage(ctx.session.newUserId, `Assalomu alaykum! 👋\n\nSiz Jomboy botda **${role}** sifatida ro'yxatdan o'tdingiz.\nBotni ishlatish uchun /start buyrug'ini bosing.`, { parse_mode: "Markdown" });
      } catch (e) {
          logger.warn({ userId: ctx.session.newUserId }, "Could not notify new user");
      }
    } else {
      await ctx.editMessageText("❌ <b>Xatolik:</b> Foydalanuvchini saqlab bo'lmadi. (Balki bazada 'nazoratchi' roli hali ruxsat etilmagan?)", { parse_mode: "HTML" });
    }

    // Asosiy menyuni qaytarish
    await ctx.reply("Asosiy menyuga qaytdingiz:", {
      reply_markup: mainMenuKeyboard(ctx.user!.role)
    });

  } catch (e) {
    logger.error({ err: e }, "Failed to add new user");
    await ctx.editMessageText("❌ Tizimda kutilmagan xatolik yuz berdi.");
    await ctx.reply("Asosiy menyuga qaytdingiz:", {
      reply_markup: mainMenuKeyboard(ctx.user!.role)
    });
  } finally {
    ctx.session.step = undefined;
    ctx.session.newUserName = undefined;
    ctx.session.newUserId = undefined;
  }
}

