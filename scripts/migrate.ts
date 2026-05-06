/**
 * Migration runner.
 * Faqat ko'rsatma uchun — Supabase SQL Editor'da qo'lda yugurtgan ma'qul.
 * Yoki psql orqali: psql $DATABASE_URL < src/db/migrations/001_initial_schema.sql
 */

import * as fs from "fs";
import * as path from "path";
import { logger } from "@/utils/logger";

const MIGRATIONS_DIR = path.join(__dirname, "..", "src", "db", "migrations");

function main() {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

  logger.info(`Found ${files.length} migration files`);
  logger.info("");
  logger.info("⚠️  Bu script faqat fayllarni ko'rsatadi.");
  logger.info("    Ularni Supabase SQL Editor'ga nusxalab joylashtiring va Run bosing.");
  logger.info("");
  logger.info("Yoki psql ishlatib:");
  logger.info("");

  files.forEach((f) => {
    const fullPath = path.join(MIGRATIONS_DIR, f);
    logger.info(`  psql $DATABASE_URL < ${fullPath}`);
  });

  logger.info("");
  logger.info("Migration fayllar joyi:");
  logger.info(`  ${MIGRATIONS_DIR}`);
}

main();
