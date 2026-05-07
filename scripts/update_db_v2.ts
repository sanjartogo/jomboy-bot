import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const DIRECTIONS = [
  { id: 1, title: "\"Konvert\" usulida ish haqi to’lash va norasmiy ishchilarni yollash holatlarini aniqlash", responsibles: ["Tuman hokimining birinchi o’rinbosari", "Mahalla uyushmasi", "Bandlik bo’limi", "Soliq inspeksiyasi", "Xalq ta’limi bo’limi", "Qishloq xo’jaligi bo’limi"] },
  { id: 2, title: "Belgilangan muddatda yakunlanmagan qurilish obyektlari bo’yicha mol-mulk va yer solig‘ini hisoblash", responsibles: ["Tuman hokimining qurilish bo’yicha o’rinbosari", "IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 3, title: "Qurilish subyektlarida 2025-yilda uy-joylarni 1 kv/m uchun 3 mln so’mdan past narxda realizatsiya qilingani bo’yicha byudjetga qo’shimcha soliq hisoblash", responsibles: ["Tuman hokimining qurilish bo’yicha o’rinbosari", "IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 4, title: "Byudjet mablag‘lari hisobidan quriladigan obyektlarda materiallar narxini oshirib ko’rsatish, xodimlarni rasmiylashtirmaslik va maxsus texnika hisobini noto’g‘ri yuritish holatlarini bartaraf etish", responsibles: ["Tuman hokimining qurilish bo’yicha o’rinbosari"] },
  { id: 5, title: "Uy-joy qurilish korxonalari qoldig‘idagi xonadonlarni realizatsiya qilish hisobidan qo’shimcha soliq hisoblash", responsibles: ["Tuman hokimining qurilish bo’yicha o’rinbosari", "IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 6, title: "Qishloq, o’rmon va suv xo’jaligi yerlarini ijaraga berishni qonuniylashtirish orqali soliq tushumlarini oshirish", responsibles: ["Tuman hokimining qishloq xo’jaligi bo’yicha o’rinbosari", "Qishloq xo’jaligi bo’limi", "Fermerlar kengashi", "IJQK Departamenti", "Soliq inspeksiyasi", "Kadastr palatasi"] },
  { id: 7, title: "Qishloq xo’jaligi mahsulotlari yetishtiruvchi subyektlar tomonidan haqiqatda foydalanilgan suv hajmini soliq hisobotlarida to’liq aks ettirmagani oqibatida to’lanmagan soliqlarni undirish", responsibles: ["Tuman hokimining qishloq xo’jaligi bo’yicha o’rinbosari", "Qishloq xo’jaligi bo’limi", "Fermerlar kengashi", "Irrigatsiya bo’limi", "Ekologiya bo’limi", "Kadastr palatasi", "Soliq inspeksiyasi"] },
  { id: 8, title: "VM 24.11.2021-yildagi 709-son qarori asosida auksion savdolari orqali ijaraga olingan qishloq xo’jaligi yerlari uchun 102,9 mlrd so’m qo’shimcha to’lovlarni undirish", responsibles: ["Tuman hokimining qishloq xo’jaligi bo’yicha o’rinbosari", "Qishloq xo’jaligi bo’limi", "Kadastr palatasi", "Agroinspeksiya", "Soliq inspeksiyasi"] },
  { id: 9, title: "Zaxiradagi qishloq xo’jaligi yer uchastkalarini \"E-auksion\" elektron savdo platformasi orqali sotish ishlarini jadallashtirish", responsibles: ["Tuman hokimining qishloq xo’jaligi bo’yicha o’rinbosari", "Qishloq xo’jaligi bo’limi", "Kadastr palatasi", "Agroinspeksiya"] },
  { id: 10, title: "Toifasi o’zgartirilgan qishloq xo’jaligi yerlari bo’yicha undirilmagan 68 mlrd so’m nobudgarchilik to’lovlarini undirish", responsibles: ["Tuman hokimining qishloq xo’jaligi bo’yicha o’rinbosari", "Qishloq xo’jaligi bo’limi", "Kadastr palatasi", "Agroinspeksiya"] },
  { id: 11, title: "Baliqchilik xo’jaliklari soliq hisobotlari va sun’iy havzalardagi hosildorlikni tahlil qilish orqali qo’shimcha byudjet tushumi manbalarini aniqlash", responsibles: ["IJQK Departamenti", "Qishloq xo’jaligi bo’limi", "Veterinariya bo’limi", "Soliq inspeksiyasi"] },
  { id: 12, title: "Chorvachilik va parrandachilik xo’jaliklari soliq hisobotlarini tahlil qilish orqali qo’shimcha byudjet tushumi manbalarini aniqlash", responsibles: ["IJQK Departamenti", "Qishloq xo’jaligi bo’limi", "Veterinariya bo’limi", "Soliq inspeksiyasi"] },
  { id: 13, title: "Qishloq xo’jaligi korxonalari (klaster, fermer) qoldig‘idagi mahsulotlarni realizatsiya qilish hisobidan soliq hisoblash", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi", "Qishloq xo’jaligi bo’limi", "Fermerlar kengashi", "Elektr tarmoqlari", "Gaz ta’minoti"] },
  { id: 14, title: "Qurilish materiallarini bozor qiymatidan past narxda realizatsiya qilish orqali soliq bazasini kamaytirib ko’rsatish holatlarini bartaraf etish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi", "Ekologiya bo’limi"] },
  { id: 15, title: "Chakana savdo sohasida tovarlarni fiskal cheksiz realizatsiya qilish holatlarining oldini olish", responsibles: ["Soliq inspeksiyasi"] },
  { id: 16, title: "Chakana va ulgurji savdo subyektlari tomonidan tovarlarni naqdga sotib qoldiqda ko’rsatish holatlarini bartaraf etish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 17, title: "Suyultirilgan gas sotuvchi subyektlar tomonidan realizatsiya hajmini yashirgani natijasida aksiz solig‘iga qo’shimcha soliq hisoblash", responsibles: ["Soliq inspeksiyasi", "Gaz ta’minoti", "IJQK Departamenti"] },
  { id: 18, title: "Majburiy markirovkalanishi belgilangan tovarlarning yashirin aylanmasi bilan bog‘liq holatlarni aniqlash", responsibles: ["Soliq inspeksiyasi"] },
  { id: 19, title: "Umumiy ovqatlanish shoxobchalari va to’yxonalardagi to’lovlarni naqd yoki P2P orqali qabul qilish holatlarini bartaraf etish", responsibles: ["Soliq inspeksiyasi"] },
  { id: 20, title: "Mol-mulki yoki ijara shartnomasi mavjud bo’lmagan/muddati o’tgan tadbirkorlik subyektlari faoliyatini qonuniylashtirish", responsibles: ["Tuman hokimining birinchi o’rinbosari", "Qurilish bo’limi", "Mahalla uyushmasi", "Soliq inspeksiyasi", "Kadastr palatasi", "Kadastr agentligi"] },
  { id: 21, title: "Mehmonxona xizmati ko’rsatuvchi subyektlar tomonidan soliq hisobotlarida aks ettirilmagan mijozlar bo’yicha soliq hisoblash", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 22, title: "Xususiy klinikalardagi yashirin iqtisodiyot ulushini qisqartirish maqsadida integratsiya ishlarini amalga oshirish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi", "Jomboy tibbiyot birlashmasi"] },
  { id: 23, title: "Farmatsevtika mahsulotlari ishlab chiqaruvchi va sotuvchi dorixonalar bo’yicha hisoblanmagan soliqlarni undirish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 24, title: "Bozor va savdo komplekslari faoliyatini nazorat qiluvchi yagona axborot tizimini yo’lga qo’yish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 25, title: "Mahalliy yuk va yo’lovchi tashish bilan shug‘ullanuvchi korxonalar faoliyatini qonuniylashtirish", responsibles: ["Soliq inspeksiyasi", "Tuman IIB"] },
  { id: 26, title: "EHF xavfini baholash va byudjetga qo’shimcha QQS jalb qilish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 27, title: "Ishlab chiqaruvchi korxonalar tomonidan xarajat va tannarxni sun’iy oshirish holatlarini bartaraf etish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 28, title: "Majburiy markirovka qilinishi shart bo’lgan mahsulotlarni markirovka kodisiz savdo qilish holatlarini bartaraf etish", responsibles: ["Soliq inspeksiyasi"] },
  { id: 29, title: "Tabiiy gaz va elektr energiyasi iste’mol qilingan, ammo \"0\" hisobot topshirganlar bo’yicha soliq undirish", responsibles: ["Soliq inspeksiyasi", "Elektr tarmoqlari", "Gaz ta’minoti"] },
  { id: 30, title: "Sanoat korxonalari qoldig‘idagi tovar-moddiy boyliklarni realizatsiya qilish hisobidan soliq hisoblash", responsibles: ["IJQK Departamenti", "Tuman MIB", "Soliq inspeksiyasi", "Tuman statistika bo’limi"] },
  { id: 31, title: "MIB ish yuritmasidagi ijro ishlari bo’yicha qarzdorlik va jarimalarni undirish", responsibles: ["Tuman MIB", "Soliq inspeksiyasi"] },
  { id: 32, title: "Tovarlar importini amalga oshirgan, biroq \"Nol\" hisobot topshirgan subyektlardan soliq undirish", responsibles: ["Tuman hokimining birinchi o’rinbosari", "IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 33, title: "Chetdan tekinga import qilingan tovarlarni realizatsiya qilgan subyektlardan soliq undirish", responsibles: ["Tuman hokimining birinchi o’rinbosari", "IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 34, title: "Omborlarda saqlanayotgan va rasmiylashtirilmagan import tovarlarni rasmiylashtirish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 35, title: "Yer osti va yer usti qazilmalar hajmini kamaytirib ko’rsatish oqibatida hisoblanmagan soliqlarni undirish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi", "Ekologiya bo’limi"] },
  { id: 36, title: "Soliq va byudjet mablag‘larini o’zlashtirish bilan bog‘liq huquqbuzarliklarni aniqlash", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
  { id: 37, title: "Sun’iy (soxta) elektron hisobvaraq-fakturalar orqali QQS summasini hisobga olish holatlarini bartaraf etish", responsibles: ["IJQK Departamenti", "Soliq inspeksiyasi"] },
];

async function updateDb() {
  console.log("Updating database schema...");

  // 1. Create directions table
  const { error: e2 } = await supabase.from('directions').select('id').limit(1);
  if (e2) {
    // Table doesn't exist, use RPC to create it
    console.log("Creating tables via RPC...");
    await supabase.rpc('exec', { sql: `
      CREATE TABLE IF NOT EXISTS directions (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS direction_assignments (
        id SERIAL PRIMARY KEY,
        direction_id INTEGER REFERENCES directions(id),
        organization_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS direction_id INTEGER;
    `});
  }

  // 2. Insert data
  console.log("Inserting directions and assignments...");
  for (const d of DIRECTIONS) {
    await supabase.from('directions').upsert({ id: d.id, title: d.title });
    await supabase.from('direction_assignments').delete().eq('direction_id', d.id);
    const assignments = d.responsibles.map(r => ({ direction_id: d.id, organization_name: r }));
    await supabase.from('direction_assignments').insert(assignments);
  }

  console.log("Database update complete!");
}

updateDb();
