import { supabase } from "@/db/supabase";
import { logger } from "@/utils/logger";
import type { User, UserRole } from "@/types";

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error) {
    logger.error({ error, telegramId }, "Failed to get user by telegram_id");
    return null;
  }
  return data as User | null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const normalized = normalizePhone(phone);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", normalized)
    .maybeSingle();

  if (error) {
    logger.error({ error, phone }, "Failed to get user by phone");
    return null;
  }
  return data as User | null;
}

export async function linkTelegramToUser(
  userId: string,
  telegramId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ telegram_id: telegramId })
    .eq("id", userId);

  if (error) {
    logger.error({ error, userId, telegramId }, "Failed to link telegram");
    return false;
  }
  return true;
}

export async function getAllUsersByRole(role: UserRole): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", role)
    .eq("is_active", true);

  if (error) {
    logger.error({ error, role }, "Failed to get users by role");
    return [];
  }
  return (data ?? []) as User[];
}

export async function createUser(userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert(userData)
    .select()
    .maybeSingle();

  if (error) {
    logger.error({ error, userData }, "Failed to create user");
    return null;
  }
  return data as User | null;
}

export async function getActiveMasullar(): Promise<User[]> {
  return getAllUsersByRole("masul");
}

/**
 * Telefon raqamni normalizatsiya qilish:
 * +998 91 549 63 25 → 998915496325
 * 91-549-63-25 → 998915496325
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) {
    cleaned = "998" + cleaned;
  }
  if (cleaned.startsWith("8") && cleaned.length === 10) {
    cleaned = "99" + cleaned;
  }
  return cleaned;
}
