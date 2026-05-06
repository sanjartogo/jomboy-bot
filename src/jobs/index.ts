import cron from "node-cron";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { morningReminder } from "@/jobs/morning-reminder";
import { eveningCheck } from "@/jobs/evening-check";
import { dailySummary } from "@/jobs/daily-summary";
import type { NotificationService } from "@/services/notification";

export function startSchedulers(notify: NotificationService) {
  const tz = env.TIMEZONE;

  // 09:00 — Ertalab eslatma
  cron.schedule(
    env.CRON_MORNING_REMINDER,
    () => {
      morningReminder(notify).catch((err) =>
        logger.error({ err }, "Morning reminder crashed")
      );
    },
    { timezone: tz }
  );

  // 18:00 — Hisobot bermaganlarni eslatish
  cron.schedule(
    env.CRON_EVENING_CHECK,
    () => {
      eveningCheck(notify).catch((err) =>
        logger.error({ err }, "Evening check crashed")
      );
    },
    { timezone: tz }
  );

  // 19:00 — Hokimga kunlik xulosa
  cron.schedule(
    env.CRON_DAILY_SUMMARY,
    () => {
      dailySummary(notify).catch((err) =>
        logger.error({ err }, "Daily summary crashed")
      );
    },
    { timezone: tz }
  );

  logger.info(
    {
      morningReminder: env.CRON_MORNING_REMINDER,
      eveningCheck: env.CRON_EVENING_CHECK,
      dailySummary: env.CRON_DAILY_SUMMARY,
      timezone: tz,
    },
    "Schedulers started"
  );
}
