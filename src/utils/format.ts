/**
 * Raqamni o'zbekcha/ruscha formatda chiqarish: 1234567 → "1 234 567"
 */
export function formatNumber(n: number, decimals = 0): string {
  const rounded = Number(n).toFixed(decimals);
  const parts = rounded.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(",");
}

/**
 * Mln so'mni o'qishbop ko'rinishga: 1500.5 → "1,5 mlrd so'm"; 234 → "234 mln so'm"
 */
export function formatMoney(mln: number): string {
  if (mln >= 1000) {
    return `${formatNumber(mln / 1000, 2)} mlrd so'm`;
  }
  return `${formatNumber(mln, 1)} mln so'm`;
}

/**
 * Foizni formatlash: 0.3245 → "32,5%"
 */
export function formatPercent(ratio: number, decimals = 1): string {
  return `${formatNumber(ratio * 100, decimals)}%`;
}

/**
 * Sanani o'zbekcha: Date → "30.04.2026"
 */
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Markdown V2 escape (Telegram)
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
