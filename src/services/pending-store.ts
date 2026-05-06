import type { PendingReport } from "@/types";
import { logger } from "@/utils/logger";

/**
 * Pending reports — mas'ul yuborgandan so'ng tasdiqlashgacha bo'lgan vaqt oraliq.
 * Production'da Redis bo'lishi kerak, lekin MVP uchun in-memory yetarli (1 instance bot).
 *
 * 10 daqiqada eskiradi.
 */
const pending = new Map<string, PendingReport>();

const TTL_MS = 10 * 60 * 1000;

export function setPending(userId: string, report: Omit<PendingReport, "expires_at">) {
  pending.set(userId, {
    ...report,
    expires_at: Date.now() + TTL_MS,
  });
}

export function getPending(userId: string): PendingReport | null {
  const p = pending.get(userId);
  if (!p) return null;
  if (Date.now() > p.expires_at) {
    pending.delete(userId);
    return null;
  }
  return p;
}

export function clearPending(userId: string) {
  pending.delete(userId);
}

// Har 5 daqiqada eskirgan recordlarni tozalash
setInterval(() => {
  const now = Date.now();
  let cleared = 0;
  for (const [userId, p] of pending.entries()) {
    if (now > p.expires_at) {
      pending.delete(userId);
      cleared++;
    }
  }
  if (cleared > 0) {
    logger.debug({ cleared }, "Cleared expired pending reports");
  }
}, 5 * 60 * 1000);
