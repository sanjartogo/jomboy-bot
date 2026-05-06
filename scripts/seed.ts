/**
 * Bazaga 38 ta yo'nalish va test foydalanuvchilarni qo'shish.
 * Run: npm run db:seed
 */

import { supabase } from "@/db/supabase";
import { DIRECTIONS } from "@/config/directions";
import { logger } from "@/utils/logger";

async function seedDirections() {
  logger.info(`Seeding ${DIRECTIONS.length} directions...`);

  for (const dir of DIRECTIONS) {
    const { error } = await supabase.from("directions").upsert({
      id: dir.id,
      name: dir.name,
      responsible_org: dir.responsible_org,
      yearly_plan_xyus: dir.yearly_plan_xyus,
      yearly_plan_sum: dir.yearly_plan_sum,
      monthly_plan: dir.monthly_plan,
    });

    if (error) {
      logger.error({ error, dirId: dir.id }, "Failed to seed direction");
    }
  }

  logger.info("Directions seeded ✅");
}

async function seedTestUsers() {
  logger.info("Seeding test users...");

  const testUsers = [
    {
      full_name: "Test Admin",
      phone: "998000000001",
      role: "admin" as const,
      direction_ids: [],
    },
    {
      full_name: "Tuman Hokimi (Test)",
      phone: "998000000002",
      role: "hokim" as const,
      direction_ids: [],
    },
    {
      full_name: "Humoyun Aliyev",
      phone: "998915496325",
      role: "masul" as const,
      direction_ids: [1, 5], // 2 ta yo'nalish
    },
    {
      full_name: "Saidjalol Rashidov",
      phone: "998979167949",
      role: "masul" as const,
      direction_ids: [2, 9, 10, 17, 20],
    },
    {
      full_name: "Aminjon Karimov",
      phone: "998915270404",
      role: "masul" as const,
      direction_ids: [3],
    },
    {
      full_name: "Yunus Tursunov",
      phone: "998975788168",
      role: "masul" as const,
      direction_ids: [4],
    },
    {
      full_name: "Feruz Nazarov",
      phone: "998915471800",
      role: "masul" as const,
      direction_ids: [6, 25],
    },
    {
      full_name: "Zokir Isaxonov",
      phone: "998502225775",
      role: "masul" as const,
      direction_ids: [7, 8, 11, 12, 13, 29],
    },
    {
      full_name: "Shuhrat Atoev",
      phone: "998902706500",
      role: "masul" as const,
      direction_ids: [14, 35],
    },
    {
      full_name: "Umid Risqulov",
      phone: "998975762757",
      role: "masul" as const,
      direction_ids: [15, 32, 33, 38],
    },
    {
      full_name: "Abdurahim Sodiqov",
      phone: "998979299592",
      role: "masul" as const,
      direction_ids: [16],
    },
    {
      full_name: "Ahmedov Akmal",
      phone: "998901977262",
      role: "masul" as const,
      direction_ids: [21, 22, 23],
    },
    {
      full_name: "Ali Kamolov",
      phone: "998906001410",
      role: "masul" as const,
      direction_ids: [26],
    },
    {
      full_name: "Obit Sharipov",
      phone: "998933320099",
      role: "masul" as const,
      direction_ids: [27, 30, 34],
    },
    {
      full_name: "Yusuf Ismoilov",
      phone: "998771219019",
      role: "masul" as const,
      direction_ids: [18, 28],
    },
    {
      full_name: "Akhtamov Bahodir",
      phone: "998900000003",
      role: "masul" as const,
      direction_ids: [31],
    },
    {
      full_name: "Samariddin Yusupov",
      phone: "998991480389",
      role: "masul" as const,
      direction_ids: [19, 24],
    },
    {
      full_name: "Davlat Xizmatchi",
      phone: "998900000004",
      role: "masul" as const,
      direction_ids: [36, 37],
    },
  ];

  for (const user of testUsers) {
    const { error } = await supabase.from("users").upsert(
      {
        ...user,
        is_active: true,
      },
      { onConflict: "phone" }
    );

    if (error) {
      logger.error({ error, user: user.full_name }, "Failed to seed user");
    }
  }

  logger.info(`Seeded ${testUsers.length} test users ✅`);
}

async function main() {
  await seedDirections();
  await seedTestUsers();
  logger.info("🎉 All seeds completed!");
  process.exit(0);
}

main().catch((err) => {
  logger.fatal({ err }, "Seed failed");
  process.exit(1);
});
