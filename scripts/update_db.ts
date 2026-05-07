import { supabase } from "../src/db/supabase";

async function addOrganizationColumn() {
  console.log("🛠 Bazaga 'organization' ustunini qo'shishga urinilmoqda...");
  
  // Eslatma: Supabase JS SDK orqali to'g'ridan-to'g'ri ALTER TABLE qilish uchun 
  // 'execute_sql' nomli RPC funksiyasi bo'lishi kerak.
  // Agar xato bersa, demak qo'lda SQL Editor orqali qilish kerak.
  
  const { error } = await supabase.rpc('execute_sql', { 
    sql_query: `
      -- 1. organization ustunini qo'shish
      ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;

      -- 2. role constraint'ni yangilash (nazoratchi qo'shish)
      -- Avval eskisini o'chirib, keyin yangisini qo'shamiz (PostgreSQL)
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('masul', 'hokim', 'admin', 'nazoratchi'));
    `
  });

  if (error) {
    console.warn("⚠️ RPC orqali bo'lmadi. Ehtimol ruxsat yo'q.");
    console.info("💡 Iltimos, Supabase dashboard -> SQL Editor bo'limiga kirib mana bu kodni ishlating:");
    console.info(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('masul', 'hokim', 'admin', 'nazoratchi'));
    `);
  } else {
    console.log("✅ Baza muvaffaqiyatli yangilandi.");
  }

}

addOrganizationColumn().catch(console.error);
