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
    await handleAddRole(ctx);
  } else if (data.startsWith("add_org:")) {
    await handleAddOrg(ctx);
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

  ctx.session.newUserRole = role;
  ctx.session.step = "awaiting_new_user_org";

  const { ORGANIZATIONS } = await import("@/config/organizations");
  const keyboard = new InlineKeyboard();
  
  ORGANIZATIONS.forEach((org, idx) => {
    keyboard.text(org.substring(0, 30), `add_org:${idx}`).row();
  });

  await ctx.editMessageText(`✅ Rol tanlandi: <b>${role}</b>\n\nEndi ushbu xodim qaysi <b>tashkilotga</b> tegishli ekanligini tanlang:`, {
    parse_mode: "HTML",
    reply_markup: keyboard
  });
}

async function handleAddOrg(ctx: BotContext) {
  const idx = parseInt(ctx.callbackQuery?.data?.replace("add_org:", "") || "0");
  const { ORGANIZATIONS } = await import("@/config/organizations");
  const selectedOrg = ORGANIZATIONS[idx];

  if (!selectedOrg || !ctx.session.newUserName || !ctx.session.newUserId || !ctx.session.newUserRole) {
    await ctx.answerCallbackQuery("Xatolik yuz berdi");
    return;
  }

  const role = ctx.session.newUserRole;
  const tempPhone = `tg_${ctx.session.newUserId}`;

  try {
    const { createUser, getUserByPhone } = await import("@/db/queries/users");
    
    // 1. Avval tekshiramiz
    const existingUser = await getUserByPhone(tempPhone);
    if (existingUser) {
      await ctx.editMessageText(`⚠️ <b>Xatolik:</b> Bu xodim (ID: ${ctx.session.newUserId}) allaqachon tizimda mavjud.`, { parse_mode: "HTML" });
      ctx.session.step = undefined;
      return;
    }

    // 2. Qo'shish
    const newUser = await createUser({
      full_name: ctx.session.newUserName,
      phone: tempPhone, 
      role: role as any,
      organization: selectedOrg,
      direction_ids: [],
      is_active: true
    });

    if (newUser) {
      const { linkTelegramToUser } = await import("@/db/queries/users");
      await linkTelegramToUser(newUser.id, ctx.session.newUserId);

      await ctx.editMessageText(
        `✅ <b>Muvaffaqiyatli!</b>\n\n` +
        `👤 Xodim: <b>${ctx.session.newUserName}</b>\n` +
        `🏢 Tashkilot: <b>${selectedOrg}</b>\n` +
        `🔑 Rol: <b>${role}</b>\n` +
        `🆔 TG ID: <code>${ctx.session.newUserId}</code>\n\n` +
        `Endi ushbu xodim botga kirishi bilan tizim uni taniydi.`,
        { parse_mode: "HTML" }
      );
    } else {

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

