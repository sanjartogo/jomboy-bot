import { InlineKeyboard, Keyboard } from "grammy";
import type { ParsedReportData } from "@/types";
import { getDirectionShortName } from "@/config/directions";
import { formatMoney } from "@/utils/format";

/**
 * Telefon yuborish uchun reply keyboard
 */
export function shareContactKeyboard(): Keyboard {
  return new Keyboard()
    .requestContact("📱 Telefon raqamimni yuborish")
    .resized()
    .oneTime();
}

/**
 * Hisobot yuborish menyusi
 */
export function mainMenuKeyboard(role: string = "masul"): Keyboard {
  if (role === "hokim" || role === "admin") {
    return new Keyboard()
      .text("📊 Kunlik xulosa")
      .text("🚨 Sustkashlar")
      .row()
      .text("📈 Umumiy statistika")
      .text("ℹ️ Yordam")
      .resized();
  }
  
  if (role === "nazoratchi") {
    return new Keyboard()
      .text("ℹ️ Yordam")
      .resized();
  }

  return new Keyboard()
    .text("📤 Hisobot yuborish")
    .text("📊 Mening reytingim")
    .row()
    .text("ℹ️ Yordam")
    .resized();
}

/**
 * AI parsing natijasini tasdiqlash uchun
 */
export function confirmParsedKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Tasdiqlash", "confirm_report")
    .text("✏️ Tahrirlash", "edit_report")
    .row()
    .text("❌ Bekor qilish", "cancel_report");
}

/**
 * Yo'nalishni tanlash uchun keyboard (bir nechta direction bo'lganda)
 */
export function directionPickerKeyboard(directionIds: number[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  directionIds.forEach((id, idx) => {
    kb.text(`№${id}`, `pick_dir:${id}`);
    if ((idx + 1) % 4 === 0) kb.row();
  });
  kb.row().text("🔢 Boshqa raqam", "pick_dir:other");
  return kb;
}

/**
 * Yes/No oddiy tasdiqlash
 */
export function yesNoKeyboard(yesData: string, noData: string): InlineKeyboard {
  return new InlineKeyboard().text("✅ Ha", yesData).text("❌ Yo'q", noData);
}

/**
 * Hokim uchun summary footer keyboard
 */
export function hokimSummaryKeyboard(date: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("📥 Excel hisobot", `export:${date}`)
    .text("📊 Batafsil", `details:${date}`);
}

import { ORGANIZATIONS } from "@/config/organizations";

/**
 * Tashkilot tanlash uchun keyboard
 */
export function organizationsKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  ORGANIZATIONS.forEach((org, idx) => {
    kb.text(org, `org_select:${idx}`).row();
  });
  return kb;
}
