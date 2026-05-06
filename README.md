# Jomboy Bot — Soliq Bazasini Kengaytirish Nazorati

AI-asosli Telegram bot, Jomboy tumanidagi 38 ta soliq qo'shimcha manba yo'nalishi bo'yicha mas'ullarni nazorat qilish uchun.

## ✨ Asosiy imkoniyatlar

- 📤 **Avtomatik ma'lumot to'plash** — Mas'ullar Excel, rasm yoki matn yuborishadi
- 🤖 **AI bilan o'qish** — Claude API yordamida har qanday formatdan ma'lumot olinadi
- 🌅 **Ertalab eslatma** — 09:00 da har bir mas'ulga bugungi rejasi yuboriladi
- 🌆 **Kechqurun nazorat** — 18:00 da hisobot bermaganlar aniqlanadi
- 📊 **Hokim uchun avto-xulosa** — 19:00 da AI tomonidan yozilgan tahlil
- 🏆 **Mas'ullar reytingi** — Motivatsiya uchun

---

## 🛠 Texnik stack

| Qatlam | Texnologiya |
|--------|-------------|
| Bot | grammY (Node.js) |
| Til | TypeScript |
| Baza | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Scheduler | node-cron |
| Logger | Pino |

---

## 🚀 Ishga tushirish (qadam-baqadam)

### 1. Talab qilinadigan akkauntlar

Avval quyidagilarni tayyorlang:

#### 1.1 Telegram Bot Token
1. Telegramda `@BotFather` ni oching
2. `/newbot` yozing
3. Bot nomi va username tanlang (masalan: `JomboyTaxBot`)
4. Sizga **bot token** beradi: `1234567890:ABCdefGHIjklmNOPqrs...`
5. Saqlang — keyin kerak bo'ladi

#### 1.2 Supabase Project
1. https://supabase.com saytiga kiring
2. **New project** bosing
3. Project name: `jomboy-bot`, region: yaqin (Frankfurt yaxshi)
4. Database password ni saqlab oling
5. Project tayyor bo'lgach, **Settings → API** bo'limidan oling:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (⚠️ bu maxfiy!)
   - `anon` key → `SUPABASE_ANON_KEY`

#### 1.3 Anthropic API Key
1. https://console.anthropic.com saytiga kiring
2. **API Keys** bo'limiga o'ting
3. **Create Key** bosing
4. Saqlang: `sk-ant-...`
5. Billing'ga $20-50 qo'shing (boshlash uchun yetadi)

#### 1.4 Sizning Telegram ID
1. Telegramda `@userinfobot` ni oching
2. `/start` bosing
3. Sizga ID beradi: `123456789`

---

### 2. Loyihani sozlash

```bash
# Loyihani clone qilish (yoki ZIP'dan unzip qilish)
cd jomboy-bot

# Dependency'larni o'rnatish
npm install

# Environment fayl yaratish
cp .env.example .env
```

`.env` faylini oching va to'ldiring:

```env
BOT_TOKEN=1234567890:ABCdefGHI...     # BotFather'dan
ADMIN_TELEGRAM_IDS=123456789          # Sizning ID
HOKIM_TELEGRAM_ID=987654321           # Hokimning ID

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJh...
SUPABASE_ANON_KEY=eyJh...

ANTHROPIC_API_KEY=sk-ant-...

TIMEZONE=Asia/Tashkent
```

---

### 3. Bazani tayyorlash

#### 3.1 Schema yaratish

Supabase Dashboard'ni oching → **SQL Editor** → **New query**

`src/db/migrations/001_initial_schema.sql` faylini ochib, butun matnni nusxalang va SQL Editor'ga joylashtiring → **Run** bosing.

Yoki terminaldan:
```bash
npm run db:migrate   # fayllarni ko'rsatadi
```

#### 3.2 Test ma'lumotlar bilan to'ldirish

```bash
npm run db:seed
```

Bu 38 yo'nalish va test mas'ullarni qo'shadi (`scripts/seed.ts` faylidagi).

> ⚠️ **Real foydalanuvchilar uchun:** `scripts/seed.ts` ichidagi `testUsers` ro'yxatini real mas'ullarning ismi va telefon raqamlari bilan almashtiring. Telefon raqami `998915496325` ko'rinishida (12 ta raqam, + belgisi yo'q) bo'lishi kerak.

---

### 4. Ishga tushirish

#### Development (kompyuteringizda):
```bash
npm run dev
```

Logda quyidagini ko'rasiz:
```
🚀 Starting Jomboy Bot...
Supabase client initialized
Schedulers started
Bot is online ✅ (username: JomboyTaxBot)
```

Endi Telegram'da botingizni oching va `/start` bosing.

#### Production:
```bash
npm run build
npm start
```

---

## 🌐 Production'ga deploy qilish

### Variant 1 — Railway (eng oson)

1. https://railway.app ga kiring
2. **New Project → Deploy from GitHub** (yoki **Empty Project → Deploy ZIP**)
3. Loyihani yuklang
4. **Variables** bo'limida `.env` faylidagi barcha o'zgaruvchilarni qo'shing
5. Railway avtomatik build va deploy qiladi

**Narxi:** ~$5/oy (free tier ko'pincha yetmaydi schedulerlar uchun)

### Variant 2 — Hetzner VPS ($5/oy)

1. Hetzner Cloud'dan VPS oling (CX11 — 2GB RAM yetadi)
2. Ubuntu 24.04 ni tanlang
3. SSH bilan ulang:

```bash
# Node.js 20 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Loyihani yuklash
git clone <your-repo> /opt/jomboy-bot
cd /opt/jomboy-bot
npm install
npm run build

# .env yaratish
nano .env  # va to'ldiring

# PM2 bilan ishga tushirish (auto-restart)
sudo npm install -g pm2
pm2 start dist/index.js --name jomboy-bot
pm2 save
pm2 startup  # systemd ga qo'shish
```

---

## 📋 Foydalanish

### Mas'ul uchun

1. Telegramda botni oching
2. `/start` bosing
3. Telefon raqamingizni yuboring (tugma orqali)
4. Bot sizni tanib, yo'nalishlaringizni ko'rsatadi
5. Kunlik hisobotni yuboring:
   - 📎 Excel fayl
   - 📷 Akt rasmi
   - ✍️ Yoki shunchaki yozing: *"3 ta korxona, 12 mln aniqlandi"*
6. Bot AI bilan o'qib, tasdiqlash so'raydi
7. ✅ tasdiqlash bilan saqlanadi

### Hokim uchun

Avtomatik 19:00 da kunlik xulosa keladi. Hech nima bosish kerak emas.

### Admin uchun

`scripts/seed.ts` orqali yangi mas'ul qo'shish mumkin yoki Supabase Dashboard'dan to'g'ridan-to'g'ri.

---

## 🐛 Troubleshooting

### Bot javob bermayapti
- Logda xato bormi? `pm2 logs jomboy-bot`
- BOT_TOKEN to'g'rimi?
- Bot polling ishlayotganini @BotFather → `/mybots` → bot tanlash → **Bot Status** orqali tekshiring

### AI noto'g'ri o'qiyapti
- Claude API key faolmi? https://console.anthropic.com → Usage
- Excel formati standardmi? Murakkab Excel'lar uchun `parseExcel` funksiyasi 50 qator bilan cheklangan — kerak bo'lsa oshiring

### Supabase ulanishi yo'q
- `SUPABASE_SERVICE_KEY` to'g'rimi (anon emas, service_role kerak)
- IP whitelist Supabase'da o'chirilganmi (default — barcha IP)

---

## 📁 Loyiha tuzilishi

```
jomboy-bot/
├── src/
│   ├── bot/                # Telegram bot logikasi
│   │   ├── commands/       # /start, /help, /reyting
│   │   ├── handlers/       # Document, photo, text, callback
│   │   ├── middlewares/    # Auth, logging
│   │   └── keyboards/      # Inline va reply tugmalar
│   ├── ai/                 # Claude integratsiya
│   │   ├── parsers/        # Excel, image, text parsers
│   │   ├── analyzers/      # Daily summary
│   │   └── prompts/        # System prompt'lar
│   ├── db/                 # Supabase queries
│   │   ├── queries/
│   │   └── migrations/     # SQL fayllar
│   ├── jobs/               # Cron schedulerlar
│   ├── services/           # Notification, pending store
│   ├── config/             # env, directions
│   ├── utils/              # Format, date, logger
│   └── types/              # TypeScript types
├── scripts/                # Seed, migrate
└── .env.example
```

---

## 💰 Taxminiy oylik xarajat

| Qism | Narxi |
|------|-------|
| Hosting (Railway yoki Hetzner) | $5-15 |
| Supabase Free tier | $0 (boshlanish uchun yetadi) |
| Claude API | $15-25 (38 mas'ul × 2 so'rov × 30 kun) |
| **Jami** | **~$20-40/oy** |

---

## 🔮 Faza 2 — kelajakdagi yaxshilanishlar

MVP'dan keyin qo'shish kerak bo'ladi:

- [ ] Web dashboard (React)
- [ ] Voice notes parsing (Whisper API)
- [ ] WhatsApp integratsiya (kim Telegram'da emas)
- [ ] PDF eksport (oylik hisobot)
- [ ] Auto-escalation (3 kun yubormasa hokim'ga avto-xabar)
- [ ] Boshqa tumanlarga rollout
- [ ] Predictive analytics

---

## 📞 Qo'llab-quvvatlash

- Texnik savollar: GitHub Issues
- Mijoz xizmati: @bolderapps_support

---

**Loyiha:** Bolder Apps × Jomboy Tuman Hokimligi
**Lisenziya:** Proprietary
**Versiya:** 1.0.0 (MVP)
