import { InputFile } from "grammy";
import type { BotContext } from "@/bot/context";
import { mainMenuKeyboard } from "@/bot/keyboards";
import { logger } from "@/utils/logger";

const MENU_BUTTONS = ["📤 Hisobot yuborish", "📊 Mening reytingim", "ℹ️ Yordam"];

export async function textHandler(ctx: BotContext) {
  if (!ctx.user) return;

  const text = ctx.message?.text;
  if (!text) return;

  // Reply keyboard buttonlari
  if (text === "📤 Hisobot yuborish") {
    const { getDirection } = await import("@/config/directions");
    const { InlineKeyboard } = await import("grammy");
    
    let message = `📋 <b>Qaysi yo'nalish bo'yicha hisobot yubormoqchisiz?</b>\n\nIltimos, quyidagilardan birini tanlang:\n`;
    
    const keyboard = new InlineKeyboard();
    
    for (const dirId of ctx.user.direction_ids) {
      const dir = getDirection(dirId);
      if (!dir) continue;
      
      let safeName = String(dir.name).substring(0, 50);
      if (dir.name.length > 50) safeName += "...";
      
      keyboard.text(`№${dirId} - ${safeName}`, `report_dir:${dirId}`).row();
    }

    await ctx.reply(message, { parse_mode: "HTML", reply_markup: keyboard });
    return;
  }

  if (text === "📊 Mening reytingim") {
    // /reyting commandga yo'naltirish
    const { reytingCommand } = await import("@/bot/commands/reyting");
    await reytingCommand(ctx);
    return;
  }

  if (text === "📋 Yo'nalishlarim" || text === "📋 Bugungi rejam") {
    await ctx.reply("Sizning menyungiz yangilandi 👇", { reply_markup: mainMenuKeyboard(ctx.user.role) });
    return;
  }

  if (text === "📊 Kunlik xulosa") {
    if (ctx.user.role !== "hokim" && ctx.user.role !== "admin") return;
    await ctx.reply("⏳ Kunlik ma'lumotlar yig'ilmoqda va AI tomonidan tahlil qilinmoqda. Biroz kuting...");
    
    try {
      const { getReportsByDate, getUsersWhoMissedToday } = await import("@/db/queries/reports");
      const { getActiveMasullar } = await import("@/db/queries/users");
      const { generateDailySummary } = await import("@/ai/analyzers/daily");
      const { todayISO } = await import("@/utils/date");
      const { formatMoney, formatDate } = await import("@/utils/format");

      const today = todayISO();
      const reports = await getReportsByDate(today);
      const masullar = await getActiveMasullar();
      const missingData = await getUsersWhoMissedToday();

      if (masullar.length === 0) {
        await ctx.reply("Hech qanday faol mas'ul xodim topilmadi.");
        return;
      }

      const analysis = await generateDailySummary({
        date: new Date(),
        reports,
        users: masullar,
        missingData,
      });

      function esc(s: string): string {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      const uniqueReportedUsers = new Set(reports.map(r => r.user_id)).size;
      const submittedPct = ((uniqueReportedUsers / masullar.length) * 100).toFixed(0);
      let message = `📊 <b>JOMBOY TUMANI — ${esc(formatDate(new Date()))}</b>\n`;
      message += `${"━".repeat(28)}\n\n`;
      message += `✅ Hisobot berganlar (xodim kesimida): <b>${uniqueReportedUsers}/${masullar.length}</b> (${submittedPct}%)\n`;
      message += `📝 Jami yuborilgan hisobotlar: <b>${reports.length}</b> ta\n`;

      if (missingData.length > 0) {
        message += `❌ Hisobotni qisman yoki to'liq bermaganlar: <b>${missingData.length}</b> ta xodim\n`;
      }
      message += "\n";

      message += `💰 <b>Bugungi natija:</b>\n`;
      message += `   Aniqlangan: ${esc(formatMoney(analysis.totalIdentified))}\n`;
      message += `   Undirilgan: ${esc(formatMoney(analysis.totalCollected))}\n`;
      message += `   Qilingan ishlar (XYUS): ${analysis.totalXyus || 0} ta\n\n`;

      if (analysis.topPerformers.length > 0) {
        message += `🟢 <b>ETAKCHILAR:</b>\n`;
        analysis.topPerformers.forEach((p, i) => {
          message += `   ${i + 1}. ${esc(p.full_name)} — ${esc(formatMoney(p.identified_sum))}\n`;
        });
        message += "\n";
      }

      if (analysis.bottomPerformers.length > 0) {
        message += `🔴 <b>EʼTIBOR TALAB:</b>\n`;
        analysis.bottomPerformers.forEach((p) => {
          message += `   • ${esc(p.full_name)} — ${esc(formatMoney(p.identified_sum))}\n`;
        });
        message += "\n";
      }

      if (analysis.summary) {
        message += `💡 <b>AI TAHLILI:</b>\n${esc(analysis.summary)}`;
      }

      await ctx.reply(message, { parse_mode: "HTML" });
    } catch (e) {
      logger.error({ err: e }, "Failed to generate on-demand summary");
      await ctx.reply("❌ Xulosa shakllantirishda xatolik yuz berdi.");
    }
    return;
  }

  if (text === "🚨 Sustkashlar") {
    if (ctx.user.role !== "hokim" && ctx.user.role !== "admin" && ctx.user.role !== "nazoratchi") return;
    
    try {
      const { getDetailedSlackersReport } = await import("@/db/queries/reports");
      const report = await getDetailedSlackersReport();
      
      let message = `🚨 <b>Bugungi sustkashlar hisoboti</b>\n(Sana: ${new Date().toLocaleDateString('uz-UZ')})\n\n`;
      
      for (const org of report) {
        message += `🏢 <b>${org.orgName}</b>\n`;
        
        for (const user of org.users) {
          const ratio = `(${user.doneCount}/${user.totalCount})`;
          message += `   ${user.emoji} ${user.full_name}: <b>${ratio} ${user.status}</b>\n`;
        }
        message += `\n`;
      }

      // Telegram chekloviga ko'ra xabarni bo'lib yuboramiz
      if (message.length > 4000) {
        const parts = message.match(/[\s\S]{1,4000}/g) || [];
        for (const part of parts) {
          await ctx.reply(part, { parse_mode: "HTML" });
        }
      } else {
        await ctx.reply(message, { parse_mode: "HTML" });
      }
      return;
    } catch (e) {
      logger.error({ err: e }, "Failed to generate detailed slackers report");
      await ctx.reply("❌ Hisobotni tayyorlashda xatolik yuz berdi.");
      return;
    }


  }


  if (text === "📈 Umumiy statistika" || text === "📈 Umumiy hisobot") {
    if (ctx.user.role !== "hokim" && ctx.user.role !== "admin" && ctx.user.role !== "nazoratchi") return;
    await ctx.reply("⏳ Excel hisobot tayyorlanmoqda. Bu biroz vaqt olishi mumkin, kuting...");
    
    try {
      const { supabase } = await import("@/db/supabase");
      const { getDirection } = await import("@/config/directions");
      const XLSX = await import("xlsx");
      
      const { data: reports, error } = await supabase
        .from("reports")
        .select("*, users(full_name, phone)")
        .order("report_date", { ascending: false });
        
      if (error) throw error;
      
      if (!reports || reports.length === 0) {
        await ctx.reply("Bazada xech qanday hisobot topilmadi.");
        return;
      }
      
      const rows = reports.map((r: any) => ({
        "Sana": r.report_date,
        "Ism Familiya": r.users?.full_name || "Noma'lum",
        "Yo'nalish (Masala)": getDirection(r.direction_id)?.name || `№${r.direction_id}`,
        "Aniqlangan summa": r.identified_sum || 0,
        "Undirilgan summa": r.collected_sum || 0,
        "Izoh": r.comment || "",
        "Hisobot turi": r.source_type
      }));
      
      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Ustunlar kengligini moslash
      ws["!cols"] = [
        { wch: 12 }, // Sana
        { wch: 25 }, // Ism Familiya
        { wch: 50 }, // Yo'nalish
        { wch: 18 }, // Aniqlangan
        { wch: 18 }, // Undirilgan
        { wch: 30 }, // Izoh
        { wch: 15 }  // Hisobot turi
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Barcha Hisobotlar");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      const file = new InputFile(buffer, "Jomboy_Umumiy_Statistika.xlsx");
      await ctx.replyWithDocument(file, { caption: "📊 <b>Umumiy statistika</b>\nBarcha xodimlarning barcha vaqtdagi hisobotlari to'plami.", parse_mode: "HTML" });
      
    } catch (e) {
      logger.error({ err: e }, "Failed to generate excel");
      await ctx.reply("❌ Excel faylni tayyorlashda xatolik yuz berdi.");
    }
    return;
  }

  if (ctx.session.step === "awaiting_support_message") {
    if (text === "❌ Bekor qilish") {
      ctx.session.step = undefined;
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: mainMenuKeyboard(ctx.user.role) });
      return;
    }
    
    const ADMIN_ID = 517053271;
    const userInfo = `🧑‍💼 F.I.O: <b>${ctx.user.full_name}</b>\n📞 Tel: ${ctx.user.phone}\n🏢 Rol: ${ctx.user.role}`;
    const msg = `🚨 <b>Yangi yordam so'rovi!</b>\n\n${userInfo}\n\n📝 <b>Xabar:</b>\n${text}`;
    
    try {
      await ctx.api.sendMessage(ADMIN_ID, msg, { parse_mode: "HTML" });
      await ctx.reply("✅ Xabaringiz administratorga yuborildi. Tez orada siz bilan bog'lanamiz.", { reply_markup: mainMenuKeyboard(ctx.user.role) });
    } catch (e) {
      logger.error({ err: e }, "Failed to send support message");
      await ctx.reply("❌ Xabarni yuborishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring yoki to'g'ridan-to'g'ri administratorga yozing.", { reply_markup: mainMenuKeyboard(ctx.user.role) });
    }
    
    ctx.session.step = undefined;
    return;
  }

  if (text === "ℹ️ Yordam") {
    ctx.session.step = "awaiting_support_message";
    await ctx.reply("✍️ Iltimos, muammongiz yoki taklifingizni batafsil yozing va menga yuboring.\n\n<i>Men uni to'g'ridan-to'g'ri administratorga yetkazaman.</i>", {
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "❌ Bekor qilish" }]],
        resize_keyboard: true
      }
    });
    return;
  }

  if (text === "👤 Xodim qo'shish") {
    if (ctx.user.role !== "hokim" && ctx.user.role !== "admin") return;
    
    ctx.session.step = "awaiting_new_user_name";
    await ctx.reply("👤 Yangi xodimning **ism-familiyasini** kiriting:", {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [[{ text: "❌ Bekor qilish" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    return;
  }

  if (ctx.session.step === "awaiting_new_user_name") {
    if (text === "❌ Bekor qilish") {
      ctx.session.step = undefined;
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: mainMenuKeyboard(ctx.user.role) });
      return;
    }
    ctx.session.newUserName = text;
    ctx.session.step = "awaiting_new_user_id";
    await ctx.reply(`👤 Ism: ${text}\n\nEndi uning **Telegram ID** raqamini kiriting:`, {
      parse_mode: "Markdown"
    });
    return;
  }

  if (ctx.session.step === "awaiting_new_user_id") {
    if (text === "❌ Bekor qilish") {
      ctx.session.step = undefined;
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: mainMenuKeyboard(ctx.user.role) });
      return;
    }
    const tgId = parseInt(text);
    if (isNaN(tgId)) {
      await ctx.reply("❌ Telegram ID raqam bo'lishi kerak. Qaytadan kiriting:");
      return;
    }
    ctx.session.newUserId = tgId;
    ctx.session.step = "awaiting_new_user_role";
    
    const { InlineKeyboard } = await import("grammy");
    const kb = new InlineKeyboard()
      .text("Nazoratchi", "add_role:nazoratchi")
      .text("Admin", "add_role:admin");
      
    await ctx.reply("👤 Rolni tanlang:", { reply_markup: kb });
    return;
  }

  // Reply keyboard tugmasi emas → AI bilan parse qilish
  if (text.length < 5) {
    await ctx.reply("Hisobot yuborish uchun batafsilroq yozing yoki menyudan tanlang 👇", {
      reply_markup: mainMenuKeyboard(ctx.user.role),
    });
    return;
  }

  if (ctx.user.role !== "masul") {
    await ctx.reply("Erkin matn faqat mas'ullar uchun. Boshqa buyruqlar uchun /help.");
    return;
  }

  if (ctx.session.step !== "awaiting_report" || !ctx.session.selectedDirectionId) {
    await ctx.reply("Iltimos, avval pastdagi <b>📤 Hisobot yuborish</b> tugmasini bosib, yo'nalishni tanlang!", {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(ctx.user.role)
    });
    return;
  }

  await ctx.reply("⏳ Hisobotingiz qabul qilinmoqda...");

  try {
    const { saveAndForwardReport } = await import("./_report-saver");
    await saveAndForwardReport(ctx, "text");
  } catch (err) {
    logger.error({ err, userId: ctx.user.id }, "Text handler failed");
    await ctx.reply("⚠️ Xatolik yuz berdi. Qaytadan yozib ko'ring.");
  }
}


function escapeMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
