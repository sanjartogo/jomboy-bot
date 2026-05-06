import type { BotContext } from "@/bot/context";
import { upsertReport } from "@/db/queries/reports";
import { getAllUsersByRole } from "@/db/queries/users";
import { getDirection } from "@/config/directions";
import { todayISO } from "@/utils/date";
import { logger } from "@/utils/logger";
import { mainMenuKeyboard } from "@/bot/keyboards";

export async function saveAndForwardReport(ctx: BotContext, type: "text" | "image" | "excel") {
  if (!ctx.user || !ctx.session.selectedDirectionId) return;

  const dirId = ctx.session.selectedDirectionId;
  const dir = getDirection(dirId);
  const dirName = dir?.name || `№${dirId}`;

  try {
    // 1. Bazaga yozish (summalar va xyus_count 0 deb olinadi)
    await upsertReport({
      user_id: ctx.user.id,
      direction_id: dirId,
      report_date: todayISO(),
      xyus_count: 0,
      identified_sum: 0,
      collected_sum: 0,
      source_type: type,
      source_file_url: null, // Fayl manzili hozircha saqlanmayapti
      raw_input: type === "text" ? ctx.message?.text : null,
      ai_confidence: 1.0,
      ai_warnings: [],
      needs_review: false,
    });

    // 2. Nazoratchiga yuborish
    const nazoratchilar = await getAllUsersByRole("nazoratchi");
    const caption = `📝 <b>Yangi hisobot keldi!</b>\n\n👤 Xodim: <b>${ctx.user.full_name}</b>\n📌 Yo'nalish: <b>${dirName}</b>\n📅 Sana: ${todayISO()}\n\n👇 <i>Ushbu hisobot ma'lumotlarini o'zingizda saqlang/umumlashtiring.</i>`;

    for (const nazoratchi of nazoratchilar) {
      if (!nazoratchi.telegram_id) continue;
      try {
        if (ctx.message?.photo || ctx.message?.document) {
          // Rasm yoki fayl bo'lsa
          await ctx.copyMessage(nazoratchi.telegram_id, {
            caption,
            parse_mode: "HTML",
          });
        } else {
          // Oddiy matn bo'lsa
          const msg = `${caption}\n\n📄 <b>Matn:</b>\n${ctx.message?.text}`;
          await ctx.api.sendMessage(nazoratchi.telegram_id, msg, { parse_mode: "HTML" });
        }
      } catch (e) {
        logger.error({ err: e, nazoratchiId: nazoratchi.telegram_id }, "Nazoratchiga xabar yuborishda xatolik");
      }
    }

    // 3. Mas'ulga tasdiq
    await ctx.reply("✅ Hisobotingiz muvaffaqiyatli qabul qilindi va Nazoratchiga yuborildi!", {
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
