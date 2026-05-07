import { supabase } from "../src/db/supabase";

async function addOrganizationColumn() {
  console.log("🛠 Bazaga 'organization' ustunini qo'shishga urinilmoqda...");
  
  // Eslatma: Supabase JS SDK orqali to'g'ridan-to'g'ri ALTER TABLE qilish uchun 
  // 'execute_sql' nomli RPC funksiyasi bo'lishi kerak.
  // Agar xato bersa, demak qo'lda SQL Editor orqali qilish kerak.
  
  const { error } = await supabase.rpc('execute_sql', { 
    sql_query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;' 
  });

  if (error) {
    console.warn("⚠️ RPC orqali bo'lmadi. Ehtimol ruxsat yo'q.");
    console.info("💡 Iltimos, Supabase dashboard -> SQL Editor bo'limiga kirib mana bu kodni ishlating:");
    console.info("ALTER TABLE users ADD COLUMN organization TEXT;");
  } else {
    console.log("✅ Baza muvaffaqiyatli yangilandi.");
  }
}

addOrganizationColumn().catch(console.error);
