import { supabase } from "@/db/supabase";

async function setRole(telegramId: number, role: string) {
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("telegram_id", telegramId)
    .select();

  if (error) {
    console.error("Xatolik:", error);
  } else if (data && data.length > 0) {
    console.log(`Foydalanuvchi (TG ID: ${telegramId}) roli ${role} ga o'zgartirildi!`);
  } else {
    console.log("Foydalanuvchi topilmadi. Avval botda /start bosib ro'yxatdan o'ting.");
  }
}

// Ishlatish: npx ts-node -r tsconfig-paths/register scripts/set_user_role.ts <telegram_id> <role>
const args = process.argv.slice(2);
const tgId = parseInt(args[0]);
const role = args[1] || "operator";

if (!tgId) {
  console.log("Iltimos Telegram ID ni kiriting: npx ts-node ... scripts/set_user_role.ts 12345678 operator");
} else {
  setRole(tgId, role).catch(console.error);
}
