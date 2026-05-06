const fs = require('fs');

const rawText = `
1. "Konvert" maosh va norasmiy ishchilarni aniqlash. (Tuman hokimining birinchi o‘rinbosari, Mahalla uyushmasi, Bandlik bo‘limi, Soliq inspeksiyasi, Xalq ta'limi, Qishloq xo‘jaligi bo‘limi)
2. Muddatida bitmagan qurilishlarga mol-mulk va yer solig‘i hisoblash. (Tuman hokimining o‘rinbosari, IJQK Departamenti, Soliq inspeksiyasi)
3. Uy-joy kvadratini 3 mln so‘mdan arzon sotgan quruvchilarga qo‘shimcha soliq hisoblash. (Tuman hokimining o‘rinbosari, IJQK Departamenti, Soliq inspeksiyasi)
4. Budjet obyektlarida narxni oshirish va norasmiy ishlatish holatlaridan qo‘shimcha soliq undirish. (Tuman hokimining o‘rinbosari)
5. Quruvchilarning sotilmay qolgan (qoldiq) uy-joylari hisobidan qo‘shimcha soliq undirish. (Tuman hokimining o‘rinbosari, IJQK Departamenti, Soliq inspeksiyasi)
6. Qishloq, o‘rmon va suv yerlari ijarasini qonuniylashtirish orqali tushumni oshirish. (Tuman hokimining o‘rinbosari, Qishloq xo‘jaligi bo‘limi, Fermerlar kengashi, IJQK Departamenti, Soliq inspeksiyasi, Kadastr palatasi)
7. Yashirilgan suv iste’moli uchun qishloq xo‘jaligi korxonalaridan soliq undirish. (Tuman hokimining o‘rinbosari, Qishloq xo‘jaligi bo‘limi, Fermerlar kengashi, Irrigatsiya bo‘limi, Ekologiya bo‘limi, Kadastr palatasi, Soliq inspeksiyasi)
8. Auksionda olingan qishloq xo‘jaligi yerlari bo‘yicha 102,9 mlrd so‘mlik qarzdorlikni undirish. (Tuman hokimining o‘rinbosari, Qishloq xo‘jaligi bo‘limi, Kadastr palatasi, Agroinspeksiya, Soliq inspeksiyasi)
9. Zaxiradagi qishloq xo‘jaligi yerlarini “E-auksion” orqali sotishni jadallashtirish. (Tuman hokimining o‘rinbosari, Qishloq xo‘jaligi bo‘limi, Kadastr palatasi, Agroinspeksiya)
10. Toifasi o‘zgargan yerlar bo‘yicha 68 mlrd so‘m nobudgarchilik to‘lovlarini undirish. (Tuman hokimining o‘rinbosari, Qishloq xo‘jaligi bo‘limi, Kadastr palatasi, Agroinspeksiya)
11. Baliqchilik xo‘jaliklari hosildorligini tahlil qilib, yashirilgan soliqlarni aniqlash. (IJQK Departamenti, Qishloq xo‘jaligi bo‘limi, Veterinariya bo‘limi, Soliq inspeksiyasi)
12. Chorvachilik va parrandachilikda soliq hisobotlarini tahlil qilib, qo‘shimcha tushum topish. (IJQK Departamenti, Qishloq xo‘jaligi bo‘limi, Veterinariya bo‘limi, Soliq inspeksiyasi)
13. Klaster va fermerlarning ombordagi qoldiq mahsulotlari sotuvidan soliq hisoblash. (IJQK Departamenti, Soliq inspeksiyasi, Qishloq xo‘jaligi bo‘limi, Fermerlar kengashi, Elektr tarmoqlari, Gaz ta'minoti)
14. Qurilish materiallarini arzon narxda ko‘rsatib, soliqdan qochish holatlarini aniqlash. (IJQK Departamenti, Soliq inspeksiyasi, Ekologiya bo‘limi)
15. Chakana savdoda cheksiz (kassa apparatisiz) savdo qilish holatlariga chek qo‘yish. (Soliq inspeksiyasi)
16. Naqdga sotilib, hisobotda "qoldiq" deb ko‘rsatilgan tovarlarni aniqlash. (IJQK Departamenti, Soliq inspeksiyasi)
17. Suyultirilgan gaz savdosini yashirganlardan qo‘shimcha aksiz solig‘i undirish. (Soliq inspeksiyasi, Gaz ta'minoti, IJQK Departamenti)
18. Markirovkalanadigan tovarlarning noqonuniy (yashirin) aylanmasini aniqlash. (Soliq inspeksiyasi)
19. To‘yxona va oshxonalardagi naqd va P2P to‘lovlarni soliq bazasiga (R-keeper, iiko orqali) integratsiya qilish. (Soliq inspeksiyasi)
20. Mulki va ijara shartnomasi yo‘q yoki muddati o‘tgan tadbirkorlarni qonuniylashtirish. (Tuman hokimining birinchi o‘rinbosari, Qurilish bo‘limi, Mahalla uyushmasi, Soliq inspeksiyasi, Kadastr palatasi, Kadastr agentligi)
21. “Mehmon.uz”da ro‘yxatdan o‘tib, soliq hisobotida ko‘rsatilmagan mehmonxona va xostellardan soliq undirish. (IJQK Departamenti, Soliq inspeksiyasi)
22. Xususiy klinikalarni “D-MED” orqali soliq tizimiga integratsiya qilib, yashirin aylanmani qisqartirish. (IJQK Departamenti, Soliq inspeksiyasi, Jomboy tibbiyot birlashmasi)
23. Sotilib, hisobotda "qoldiq" qilingan dori-darmonlar uchun dorixonalardan soliq undirish. (IJQK Departamenti, Soliq inspeksiyasi)
24. Bozor va savdo komplekslari faoliyati (tushum, ijara, joy) bo‘yicha yagona axborot tizimini yaratish. (IJQK Departamenti, Soliq inspeksiyasi)
25. Norasmiy yuk va yo‘lovchi tashish faoliyatini qonuniylashtirish. (Soliq inspeksiyasi, Tuman IIB - DAN)
26. Elektron hisobvaraq-faktura (EHF) nazorati orqali yashirilgan QQSni budjetga undirish. (IJQK Departamenti, Soliq inspeksiyasi)
27. Tannarx va xarajatlarni sun’iy oshirib, foyda solig‘idan qochish holatlarini bartaraf etish. (IJQK Departamenti, Soliq inspeksiyasi)
28. Majburiy markirovkasiz tovarlar savdosini aniqlash va chek qo‘yish. (Soliq inspeksiyasi)
29. Gaz va svet ishlatib, soliqqa "0" hisobot topshirgan korxonalardan 11 mlrd so‘m undirish. (Soliq inspeksiyasi, Elektr tarmoqlari, Gaz ta'minoti)
30. Sanoat korxonalari omboridagi qoldiq tovarlarni sotish hisobidan soliq undirish. (IJQK Departamenti, Tuman MIB, Soliq inspeksiyasi, Tuman statistika bo‘limi)
31. MIBdagi ijro ishlari bo‘yicha qarz va jarimalarni to‘liq undirish. (Tuman MIB, Soliq inspeksiyasi)
32. Import hajmini yashirgan yoki "0" hisobot topshirganlardan 136,1 mlrd so‘m soliq undirish. (Tuman hokimining birinchi o‘rinbosari, IJQK Departamenti, Soliq inspeksiyasi)
33. Chetdan tekinga import qilinib, sotib yuborilgan tovarlar uchun soliq hisoblash. (Tuman hokimining birinchi o‘rinbosari, IJQK Departamenti, Soliq inspeksiyasi)
34. Bojxona omborida uzoq saqlanayotgan (IM-40 ga o‘tmagan) 102,1 mln dollarlik tovarlarni rasmiylashtirish. (IJQK Departamenti, Soliq inspeksiyasi)
35. Qazib olingan ruda va noruda boyliklar hajmini yashirganlardan soliq undirish. (IJQK Departamenti, Soliq inspeksiyasi, Ekologiya bo‘limi)
36. Soliqdan qochish va budjetni o‘zlashtirish bo‘yicha aniqlangan 74 mlrd so‘mlik zararni undirish. (IJQK Departamenti, Soliq inspeksiyasi)
37. Moliyaviy nazorat tadbirlarida aniqlangan 22 mlrd so‘mni budjetga tiklash. (Mavjud emas)
38. Kirim qilinmagan tovarlarga soxta EHF yozib, QQSdan qochganlarni aniqlash. (IJQK Departamenti, Soliq inspeksiyasi)
`;

const yearlySums = [
  216600.0, 39000.0, 15400.0, 130000.0, 57000.0, 20000.0, 38000.0, 102900.0, 24000.0, 18000.0,
  5400.0, 26900.0, 300000.0, 49500.0, 9000.0, 282800.0, 34600.0, 5600.0, 15000.0, 6000.0,
  5700.0, 12000.0, 192500.0, 4600.0, 29900.0, 7500.0, 9100.0, 15000.0, 11000.0, 350100.0,
  120000.0, 136100.0, 36700.0, 147000.0, 9100.0, 200000.0, 100000.0, 170000.0
];

const lines = rawText.trim().split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  // remove leading number like "1. "
  line = line.replace(/^\d+\.\s*/, '');
  
  // match name and orgs in parenthesis
  // Some don't have parenthesis properly if it's the last one, but they do end with )
  const match = line.match(/^(.*?)\s*\((.*?)\)$/);
  
  let name = line;
  let orgs = [];
  if (match) {
    name = match[1].trim();
    orgs = match[2].split(',').map(o => o.trim());
  }

  result.push({
    id: i + 1,
    name: name,
    organizations: orgs,
    yearly_plan_sum: yearlySums[i]
  });
}

fs.writeFileSync('src/config/directions-data.json', JSON.stringify(result, null, 2));
console.log('Done writing directions-data.json');
