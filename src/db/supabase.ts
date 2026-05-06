import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

logger.info("Supabase client initialized");
