import type { BotContext } from "@/bot/context";
import { upsertReport } from "@/db/queries/reports";
import { getAllUsersByRole } from "@/db/queries/users";
import { getDirection } from "@/config/directions";
import { todayISO } from "@/utils/date";
import { logger } from "@/utils/logger";
import { mainMenuKeyboard } from "@/bot/keyboards";
import { InlineKeyboard } from "grammy";

export async function saveAndForwardReport(ctx: BotContext, type: "text" | "image" | "excel") {
  if (!ctx.user || !ctx.session.selectedDirectionId) return;

  const dirId = ctx.session.selectedDirectionId;
  const dir = getDirection(dirId);
  const dirName = dir?.name || `№${dirId}`;

  try {
    // 1. AI orqali tahlil qilish (agar matn bo'lsa)
    let xyusCount = 0;
    let identifiedSum = 0;
    let collectedSum = 0;
    let aiWarnings: string[] = [];

    if (type === "text" && ctx.message?.text) {
      const { parseReportData } = await import("@/ai/parsers/report");
      const parsed = await parseReportData(ctx.message.text, "text");
      
      if (parsed.directions.length > 0) {
        const d = parsed.directions[0];
        xyusCount = d.xyus_count || 0;
        identifiedSum = d.identified_sum || 0;
        collectedSum = d.collected_sum || 0;
      }
      aiWarnings = parsed.warnings || [];
    }

    let sourceType: any = type;
    if (ctx.message?.voice) sourceType = "voice";
    else if (ctx.message?.video) sourceType = "video";
    else if (ctx.message?.audio) sourceType = "audio";

    const report = await upsertReport({
      user_id: ctx.user.id,
      direction_id: dirId,
      report_date: todayISO(),
      xyus_count: xyusCount,
      identified_sum: identifiedSum,
      collected_sum: collectedSum,
      source_type: sourceType,
      source_file_url: null, 
      raw_input: type === "text" ? ctx.message?.text : null,
      ai_confidence: 1.0,
      ai_warnings: aiWarnings,
      needs_review: false,
    });

    if (!report) throw new Error("Failed to save report");

    // 2. Nazoratchilarga yuborish
    const recipients = await getAllUsersByRole("nazoratchi");

    const { formatMoney } = await import("@/utils/format");

    const caption = `📝 <b>Yangi hisobot keldi!</b>\n\n` +
      `🏢 Tashkilot: <b>${ctx.user.organization || "Noma'lum"}</b>\n` +
      `👤 Xodim: <b>${ctx.user.full_name}</b>\n` +
      `📌 Yo'nalish: <b>${dirName}</b>\n` +
      `📅 Sana: ${todayISO()}\n\n` +
      `🔢 <b>Ma'lumotlar:</b>\n` +
      `   • XYUS: ${xyusCount} ta\n` +
      `   • Aniqlangan: ${formatMoney(identifiedSum)}\n` +
      `   • Undirilgan: ${formatMoney(collectedSum)}\n\n` +
      `👇 <i>Ushbu hisobot ma'lumotlarini tekshiring va tasdiqlang.</i>`;


    const keyboard = new InlineKeyboard()
      .text("✅ Ko'rib chiqildi", `review_report:${report.id}`);

    for (const recipient of recipients) {
      if (!recipient.telegram_id) continue;
      try {
        if (ctx.message?.text && type === "text") {
          const msg = `${caption}\n\n📄 <b>Matn:</b>\n${ctx.message?.text}`;
          await ctx.api.sendMessage(recipient.telegram_id, msg, { 
            parse_mode: "HTML",
            reply_markup: keyboard,
          });
        } else {
          // Barcha media turlari uchun copyMessage ishlatamiz
          await ctx.copyMessage(recipient.telegram_id, {
            caption,
            parse_mode: "HTML",
            reply_markup: keyboard,
          });
        }
      } catch (e) {
        logger.error({ err: e, recipientId: recipient.telegram_id }, "Recipientga xabar yuborishda xatolik");
      }
    }

    // 3. Mas'ulga tasdiq
    await ctx.reply("✅ Ma'lumot nazoratchiga yuborildi", {
      reply_markup: mainMenuKeyboard(ctx.user.role),
    });

  } catch (err) {
    logger.error({ err, userId: ctx.user.id }, "Hisobotni saqlashda xatolik");
    await ctx.reply("❌ Hisobotni saqlashda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.");
  } finally {
    // 4. Sessiyani tozalash
    ctx.session.step = undefined;
    ctx.session.selectedDirectionId = undefined;
  }
}
