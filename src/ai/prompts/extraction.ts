import { DIRECTIONS } from "@/config/directions";

/**
 * Mas'ul yuborgan ma'lumotni structured datagaga aylantirish uchun prompt.
 *
 * Bu prompt 38 ta yo'nalishni qisqacha ro'yxat qilib beradi, AI mos yo'nalishni
 * topishi uchun. Excel/rasm/matn — har xil source typelar uchun universal.
 */
export function buildExtractionPrompt(): string {
  const directionsList = DIRECTIONS.map(
    (d) => `${d.id}. ${d.name.slice(0, 120)}`
  ).join("\n");

  return `Sen Samarqand viloyati Jomboy tumani soliq nazorati tizimi uchun ma'lumot ekstraktorisan.

Foydalanuvchi yuborgan Excel jadvali, rasm yoki matnda quyidagi ma'lumotlarni topishing kerak:
- direction_id: Yo'nalish raqami (1 dan 38 gacha)
- xyus_count: Aniqlangan XYUS (xo'jalik yurituvchi subyekt) soni - butun son
- identified_sum: Aniqlangan summa - mln so'mda (nuqta bilan: 12.5)
- collected_sum: Tushum summasi - mln so'mda

YO'NALISHLAR RO'YXATI:
${directionsList}

QOIDALAR:
1. Javob FAQAT JSON ko'rinishida bo'lsin, hech qanday markdown va izoh bilan emas.
2. Bir nechta yo'nalish bo'lishi mumkin — har birini alohida obyekt qiling.
3. Agar yo'nalish raqami noaniq bo'lsa, direction_id ni null qiling va direction_name_guess ga taxminni yozing.
4. Agar summa "mlrd" da bo'lsa, mlnga aylanting (1 mlrd = 1000 mln).
5. Agar summa "ming so'm" yoki shunchaki "so'm" da bo'lsa, mlnga aylanting (1 mln = 1 000 000).
6. confidence — 0.0 dan 1.0 gacha. Agar 100% ishonsangiz 0.95+, agar shubha bo'lsa 0.5-0.7, agar deyarli bilmaysiz 0.3 dan past.
7. needs_clarification: true qilib qo'ying agar:
   - Yo'nalish raqami aniq emas
   - Summa formati noaniq
   - Bir nechta interpretatsiya mumkin
8. warnings: Har qanday muammo yoki shubhani shu yerda yozing.

JAVOB FORMATI:
{
  "directions": [
    {
      "direction_id": 1,
      "direction_name_guess": null,
      "xyus_count": 3,
      "identified_sum": 12.5,
      "collected_sum": 8.0,
      "confidence": 0.95
    }
  ],
  "warnings": [],
  "needs_clarification": false
}

Hech qanday qo'shimcha matn — faqat JSON.`;
}
