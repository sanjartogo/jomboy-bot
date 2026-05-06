import { createBot } from "@/bot";
import { startSchedulers } from "@/jobs";
import { NotificationService } from "@/services/notification";
import { logger } from "@/utils/logger";

async function main() {
  logger.info("🚀 Starting Jomboy Bot...");

  const bot = createBot();
  const notify = new NotificationService(bot);

  // Schedulerlarni ishga tushirish
  startSchedulers(notify);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    await bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  // Simple HTTP server to keep Render/Railway deployments alive
  const http = await import("http");
  const port = process.env.PORT || 3000;
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running!");
  }).listen(port, () => {
    logger.info(`HTTP server listening on port ${port}`);
  });

  // Bot start (long polling)
  logger.info("Bot started, listening for updates...");
  await bot.start({
    drop_pending_updates: true,
    onStart: (botInfo) => {
      logger.info(
        { username: botInfo.username, id: botInfo.id },
        "Bot is online ✅"
      );
    },
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal error in main");
  process.exit(1);
});
