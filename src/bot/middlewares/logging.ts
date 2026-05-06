import type { NextFunction } from "grammy";
import type { BotContext } from "@/bot/context";
import { logger } from "@/utils/logger";

export async function loggingMiddleware(ctx: BotContext, next: NextFunction) {
  const start = Date.now();
  const updateType = ctx.update.message?.text
    ? "text"
    : ctx.update.message?.document
    ? "document"
    : ctx.update.message?.photo
    ? "photo"
    : ctx.update.callback_query
    ? "callback"
    : "other";

  try {
    await next();
    const duration = Date.now() - start;
    logger.debug(
      {
        userId: ctx.from?.id,
        username: ctx.from?.username,
        updateType,
        duration,
      },
      "Update handled"
    );
  } catch (err) {
    logger.error(
      {
        err,
        userId: ctx.from?.id,
        updateType,
      },
      "Update handler failed"
    );

    try {
      await ctx.reply(
        "⚠️ Texnik xatolik yuz berdi. Qaytadan urinib ko'ring yoki adminga murojaat qiling."
      );
    } catch {
      // ignore reply errors
    }
  }
}
