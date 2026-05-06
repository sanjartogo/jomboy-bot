import type { NextFunction } from "grammy";
import type { BotContext } from "@/bot/context";
import { getUserByTelegramId } from "@/db/queries/users";
import { logger } from "@/utils/logger";

/**
 * Har bir update'da user'ni DB'dan topib ctx.user ga qo'yadi.
 * Agar topilmasa, ctx.user undefined bo'ladi (handler'da o'zi tekshiradi).
 */
export async function authMiddleware(ctx: BotContext, next: NextFunction) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    return next();
  }

  try {
    const user = await getUserByTelegramId(telegramId);
    if (user && user.is_active) {
      ctx.user = user;
    }
  } catch (err) {
    logger.error({ err, telegramId }, "Auth middleware error");
  }

  await next();
}

/**
 * Faqat ro'yxatdan o'tgan foydalanuvchilar o'tishi uchun guard.
 */
export function requireAuth() {
  return async (ctx: BotContext, next: NextFunction) => {
    if (!ctx.user) {
      await ctx.reply(
        "❌ Siz ro'yxatdan o'tmagansiz.\n\n" +
        "Iltimos, /start komandasi orqali boshlang va o'z tashkilotingizni tanlang."
      );
      return;
    }
    await next();
  };
}

/**
 * Faqat hokim yoki admin uchun.
 */
export function requireRole(...roles: Array<"masul" | "hokim" | "admin">) {
  return async (ctx: BotContext, next: NextFunction) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      await ctx.reply("❌ Sizda bu komandaga ruxsat yo'q.");
      return;
    }
    await next();
  };
}
