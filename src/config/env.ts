import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Bot
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN required"),
  ADMIN_TELEGRAM_IDS: z.string().transform((s) =>
    s.split(",").map((id) => Number(id.trim())).filter(Boolean)
  ),
  HOKIM_TELEGRAM_ID: z.string().transform(Number),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Gemini (Free AI)
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),

  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  TIMEZONE: z.string().default("Asia/Tashkent"),

  // Cron
  CRON_MORNING_REMINDER: z.string().default("0 9 * * *"),
  CRON_EVENING_CHECK: z.string().default("0 18 * * *"),
  CRON_DAILY_SUMMARY: z.string().default("0 19 * * *"),
  CRON_WEEKLY_REPORT: z.string().default("0 20 * * 0"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
