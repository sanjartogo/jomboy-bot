import { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { supabase } from "@/db/supabase";
import { logger } from "@/utils/logger";

export class NotificationService {
  constructor(private bot: Bot<BotContext>) {}

  /**
   * Foydalanuvchiga xabar yuborish + log qilish.
   */
  async send(
    telegramId: number,
    message: string,
    options: {
      type: string;
      userId?: string;
      parseMode?: "HTML" | "MarkdownV2";
    }
  ): Promise<boolean> {
    try {
      await this.bot.api.sendMessage(telegramId, message, {
        parse_mode: options.parseMode,
      });

      if (options.userId) {
        await supabase.from("notifications").insert({
          user_id: options.userId,
          type: options.type,
          message: message.slice(0, 1000),
          delivered: true,
        });
      }

      return true;
    } catch (err) {
      logger.error(
        { err, telegramId, type: options.type },
        "Failed to send notification"
      );

      if (options.userId) {
        await supabase.from("notifications").insert({
          user_id: options.userId,
          type: options.type,
          message: message.slice(0, 1000),
          delivered: false,
          error_text: String(err).slice(0, 500),
        });
      }

      return false;
    }
  }
}
