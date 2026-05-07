import { supabase } from "../src/db/supabase";

async function clearDatabase() {
  console.log("🧹 Bazani tozalash boshlandi...");

  // Avval bog'liq jadvallarni (reports) tozalaymiz
  const { error: reportsError } = await supabase
    .from("reports")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Barcha qatorlarni tanlash uchun

  if (reportsError) {
    console.error("❌ Hisobotlarni o'chirishda xatolik:", reportsError);
  } else {
    console.log("✅ Barcha hisobotlar o'chirildi.");
  }

  // Keyin foydalanuvchilarni (users) tozalaymiz
  // DIQQAT: Admin va Hokimni o'chirib yubormaslik uchun ularni saqlab qolamiz
  const { error: usersError } = await supabase
    .from("users")
    .delete()
    .not("role", "in", '("hokim", "admin")');

  if (usersError) {
    console.error("❌ Foydalanuvchilarni o'chirishda xatolik:", usersError);
  } else {
    console.log("✅ Mas'ul xodimlar o'chirildi (Hokim va Adminlar qoldi).");
  }

  console.log("✨ Tozalash yakunlandi!");
}

clearDatabase().catch(console.error);
