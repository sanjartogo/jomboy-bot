import { Bot, session } from "grammy";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import type { BotContext, SessionData } from "@/bot/context";

import { authMiddleware, requireAuth } from "@/bot/middlewares/auth";
import { loggingMiddleware } from "@/bot/middlewares/logging";

import { startCommand, handleContact } from "@/bot/commands/start";
import { helpCommand } from "@/bot/commands/help";
import { reytingCommand } from "@/bot/commands/reyting";

import { documentHandler } from "@/bot/handlers/document";
import { photoHandler } from "@/bot/handlers/photo";
import { textHandler } from "@/bot/handlers/text";
import { callbackHandler } from "@/bot/handlers/callback";
import { mediaHandler } from "@/bot/handlers/media";
import { registerCallbackHandler, registerTextHandler, registerContactHandler } from "@/bot/commands/register";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  // Session
  bot.use(
    session<SessionData, BotContext>({
      initial: () => ({}),
    })
  );

  // Middlewares (tartibi muhim)
  bot.use(loggingMiddleware);
  bot.use(authMiddleware);

  // Commands (ro'yxatdan o'tmaganlarga ham /start ishlaydi)
  bot.command("start", startCommand);
  bot.on(":contact", registerContactHandler); // Ro'yxatdan o'tish uchun kontaktni tutib olamiz

  // Authenticated commands
  bot.command("help", requireAuth(), helpCommand);
  bot.command("reyting", requireAuth(), reytingCommand);

  // Registration steps (unauthenticated)
  bot.on("callback_query:data", registerCallbackHandler);
  bot.on("message:text", registerTextHandler);

  // Handlers
  bot.on([":voice", ":audio", ":video"], requireAuth(), mediaHandler);
  bot.on(":document", requireAuth(), documentHandler);
  bot.on(":photo", requireAuth(), photoHandler);
  bot.on("callback_query:data", requireAuth(), callbackHandler);
  bot.on("message:text", requireAuth(), textHandler);

  // Error handler
  bot.catch((err) => {
    logger.error({ err }, "Bot caught unhandled error");
  });

  return bot;
}
