import type { BotContext } from "@/bot/context";

export async function helpCommand(ctx: BotContext) {
  const role = ctx.user?.role ?? "guest";

  const baseHelp =
    `📖 *Yordam — Jomboy Bot*\n\n` +
    `Asosiy buyruqlar:\n` +
    `• /start — Bosh sahifa\n` +
    `• /help — Bu yordam\n`;

  const masulHelp =
    `\n*Mas'ullar uchun:*\n` +
    `• Hisobot yuborish — fayl, rasm yoki matn jo'nating\n` +
    `• /reyting — Mening reytingim\n` +
    `• /bugun — Bugungi rejam\n\n` +
    `*Hisobot misollari:*\n` +
    `1️⃣ Excel fayl jo'nating — bot avtomatik o'qiydi\n` +
    `2️⃣ Akt rasmini jo'nating — AI o'qib oladi\n` +
    `3️⃣ Yoki yozing: \\"№1 — 3 ta XYUS, 12 mln aniqladim, 8 mln tushum\\"\n`;

  const hokimHelp =
    `\n*Hokim uchun:*\n` +
    `• /xulosa — Bugungi xulosa\n` +
    `• /xulosa\\_haftalik — Haftalik hisobot\n` +
    `• /sustkash — Hisobot bermaganlar\n`;

  const adminHelp =
    `\n*Admin uchun:*\n` +
    `• /stats — Tizim statistikasi\n` +
    `• /test\\_xulosa — Sinov xulosa yuborish\n`;

  const nazoratchiHelp =
    `\n*Nazoratchi uchun:*\n` +
    `• 📊 Umumiy statistika — Excel hisobotini yuklab olish\n` +
    `• 🚨 Sustkashlar — Hisobot bermaganlar ro'yxati\n`;

  let message = baseHelp;
  if (role === "masul") message += masulHelp;
  else if (role === "hokim" || role === "admin") message += hokimHelp + adminHelp + `\n*Xodim qo'shish* bo'limi orqali yangi admin yoki nazoratchi qo'shishingiz mumkin.`;
  else if (role === "nazoratchi") message += nazoratchiHelp;

  message += `\n\nTexnik yordam: @bolderapps\\_support`;

  await ctx.reply(message, { parse_mode: "MarkdownV2" });
}
