import { supabase } from "@/db/supabase";

async function main() {
  const { data, error } = await supabase.from("users").upsert({
    telegram_id: 517053271,
    full_name: "Asosiy Admin",
    phone: "998000000000",
    role: "admin",
    direction_ids: [],
    is_active: true
  }, { onConflict: "phone" });

  if (error) {
    console.error("Xatolik yuz berdi:", error);
  } else {
    console.log("Admin muvaffaqiyatli qo'shildi!");
  }
}

main().catch(console.error);
