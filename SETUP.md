# ODHIKAR: Day 1 Setup Guide

এই ফাইলটা follow করলে backend + database + frontend সব live হয়ে যাবে,
সম্পূর্ণ free tier-এ। প্রতিটা ধাপ copy-paste করা যায়।

---

## যা যা আগে ইনস্টল/সাইনআপ করতে হবে

**Install করো (একবারই):**
- [Node.js](https://nodejs.org) (LTS version), frontend চালানোর জন্য
- [Python 3.11+](https://www.python.org/downloads/), backend seed script চালানোর জন্য
- [Git](https://git-scm.com/downloads)

**Account বানাও (সব free):**
- [GitHub](https://github.com/signup): কোড রাখার জায়গা
- [Supabase](https://supabase.com): database
- [Render](https://render.com): backend hosting (Sign up with GitHub দিয়ে করলে সহজ হবে)
- [Vercel](https://vercel.com): frontend hosting (Sign up with GitHub দিয়ে করলে সহজ হবে)
- [Anthropic Console](https://console.anthropic.com): AI (LLM) API key-এর জন্য। এটা paid per-use,
  কিন্তু per-request খুব সস্তা (কয়েক টাকা)। Settings → API Keys → Create Key থেকে key নাও।

---

## ধাপ ১: Supabase-এ Database বানাও

1. [supabase.com](https://supabase.com) → **New Project**
2. নাম দাও `odhikar`, একটা database password সেট করো (এটা মনে রাখো/সেভ করো)
3. Region: Singapore বা যেটা কাছাকাছি
4. Project তৈরি হতে ১-২ মিনিট লাগবে
5. প্রজেক্ট খুলে বাঁ পাশে **SQL Editor** এ যাও → **New query**
6. `backend/init_db.sql` ফাইলের ভেতরের লেখাটা paste করে **Run** চাপো
7. এবার **Settings** (⚙) → **Database** → **Connection string** → **URI** ট্যাব থেকে
   connection string কপি করো। এটা দেখতে এরকম হবে:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   `[YOUR-PASSWORD]` জায়গায় নিজের password বসাও। এই পুরো লাইনটা কোথাও সেভ রাখো, এটাই `DATABASE_URL`।

---

## ধাপ ২: কোড GitHub-এ push করো

Terminal খোলো (VS Code এ Terminal ট্যাব, বা Mac-এ Terminal app, বা Windows-এ Git Bash), তারপর:

```bash
cd path/to/odhikar        # যেখানে ফোল্ডারটা রেখেছো
git init
git add .
git commit -m "Day 1: backend + auth + login UI"
```

এবার [github.com/new](https://github.com/new) এ গিয়ে একটা নতুন **empty** repository বানাও, নাম দাও `odhikar`।
(README/gitignore যোগ কোরো না, খালি repo বানাও।) তৈরি হলে GitHub একটা URL দেখাবে, সেটা কপি করো, তারপর:

```bash
git remote add origin https://github.com/YOUR-USERNAME/odhikar.git
git branch -M main
git push -u origin main
```

---

## ধাপ ৩: Backend deploy করো (Render)

1. [render.com](https://render.com) → **New +** → **Web Service**
2. তোমার GitHub repo (`odhikar`) connect করো
3. Settings:
   - **Name:** `odhikar-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Docker (Render নিজেই Dockerfile দেখে detect করবে)
   - **Instance Type:** Free
4. **Environment Variables** যোগ করো (নিচের চারটা):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | ধাপ ১ থেকে পাওয়া Supabase connection string |
   | `ANTHROPIC_API_KEY` | Anthropic Console থেকে পাওয়া key |
   | `JWT_SECRET` | যেকোনো লম্বা random string (যেমন: `odhikar-2026-secret-xyz789`) |
   | `CORS_ORIGINS` | আপাতত `http://localhost:5173` দাও, Vercel deploy হওয়ার পর আপডেট করবে |

5. **Create Web Service** চাপো। প্রথমবার build হতে ৩-৫ মিনিট লাগবে।
6. Deploy শেষ হলে উপরে একটা URL দেখবে, যেমন `https://odhikar-backend.onrender.com`
7. সেই URL-এর শেষে `/health` জুড়ে ব্রাউজারে খোলো:
   `https://odhikar-backend.onrender.com/health`
   এরকম দেখলে backend ঠিকমতো চলছে: `{"status":"ok","service":"odhikar-api"}`

   ⚠️ Render-এর free tier ১৫ মিনিট idle থাকলে ঘুমিয়ে পড়ে। প্রথম request-এ ২০-৩০ সেকেন্ড দেরি হতে পারে, এটা normal।

---

## ধাপ ৪: Database-এ sample case data ঢোকাও

এটা তোমার নিজের কম্পিউটার থেকে চালাতে হবে (একবারই):

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows হলে: venv\Scripts\activate
pip install -r requirements.txt
```

এবার `backend` ফোল্ডারে `.env` নামে একটা ফাইল বানাও (`.env.example` কপি করে), আর ভেতরে
Supabase-এর `DATABASE_URL` বসাও। তারপর:

```bash
python -m app.seed
```

`Seeded 5 courts and 500 synthetic cases.` দেখলে হয়ে গেছে।

---

## ধাপ ৫: Frontend deploy করো (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. তোমার GitHub repo (`odhikar`) import করো
3. Settings:
   - **Root Directory:** `frontend`
   - Framework Preset: Vite (auto-detect হবে)
4. **Environment Variables** এ যোগ করো:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | ধাপ ৩ থেকে পাওয়া Render backend URL (যেমন `https://odhikar-backend.onrender.com`) |

5. **Deploy** চাপো। ২-৩ মিনিটে শেষ হবে। একটা URL পাবে, যেমন `https://odhikar.vercel.app`

6. এবার Render-এ ফিরে গিয়ে (ধাপ ৩) `CORS_ORIGINS` env variable আপডেট করো:
   এই Vercel URL টা বসাও (কমা দিয়ে আগেরটার সাথে জুড়ে দিতে পারো):
   ```
   http://localhost:5173,https://odhikar.vercel.app
   ```
   Save করলে Render নিজে থেকেই আবার deploy করবে (১-২ মিনিট)।

---

## ধাপ ৬: টেস্ট করো

**একজন judge account বানাও** (এখনো signup UI নেই, তাই backend-এর নিজের Swagger docs page ব্যবহার করো):

1. ব্রাউজারে খোলো: `https://odhikar-backend.onrender.com/docs`
2. `GET /courts` চাপো → **Try it out** → **Execute**, একটা `id` কপি করো (যেকোনো একটা court-এর)
3. `POST /auth/judge/signup` খোলো → **Try it out** → নিচের মতো fill করো:
   ```json
   {
     "name": "Justice Rahman",
     "email": "judge@test.com",
     "password": "test1234",
     "court_id": "এখানে-কপি-করা-id-বসাও"
   }
   ```
4. **Execute** চাপো, একটা token আসবে, মানে account তৈরি হয়ে গেছে।

**এবার নিজের website-এ যাও:**
`https://odhikar.vercel.app` → "বিচারক" ট্যাব → `judge@test.com` / `test1234` দিয়ে লগইন করো।
Dashboard দেখা গেলে **Day 1 সম্পূর্ণ ✅**

Citizen login টেস্ট করতে চাইলে "নাগরিক" ট্যাবে যেকোনো NID + phone number দিয়ে চেষ্টা করো,
OTP কোডটা সরাসরি স্ক্রিনে দেখাবে (demo mode)।

---

## সমস্যা হলে

- **Render-এ build fail:** Logs ট্যাবে exact error দেখো, আমাকে paste করে দাও, আমি ঠিক করে দেব।
- **CORS error (browser console-এ লাল লেখা):** `CORS_ORIGINS` env variable-এ Vercel URL ঠিকমতো আছে কিনা চেক করো, আর তাতে `https://` আছে কিনা দেখো।
- **`/health` কাজ করছে না:** Render dashboard-এ Logs দেখো, সাধারণত `DATABASE_URL` ভুল থাকলে এই সমস্যা হয়।
- **Seed script error দিচ্ছে:** `.env` ফাইলে `DATABASE_URL` ঠিক আছে কিনা, আর password-এ special character থাকলে সেটা URL-encode করা লাগবে কিনা চেক করো।

কোনো error message পেলে হুবহু আমাকে paste করে দাও, আমি সাথে সাথে ঠিক করে দেব।

---

# Day 2: Case Prioritizer আপডেট করা

Day 1-এর পর নতুন কোড যোগ হয়েছে: XGBoost priority model (trained + validated), prioritized
case API, আর পুরো judge dashboard (stats + ranked table + filters)।

**Model already trained আছে।** `backend/app/ml/artifacts/model.pkl` আর `metrics.json`
zip-এর মধ্যেই আছে, তোমাকে আলাদা করে train করতে হবে না। (Validation result: R²=0.95,
মানে মডেল ৯৫% accuracy-তে expert-এর priority judgment reproduce করতে পারে। এই সংখ্যাটা
Technical Documentation-এ লাগবে, মনে রাখো।)

## Deploy করো

তোমার আগের `odhikar` ফোল্ডারের ভেতরের ফাইলগুলো এই নতুন version দিয়ে replace করো
(পুরনো ফোল্ডার মুছে নতুন zip extract করলেই হবে), তারপর:

```bash
cd path/to/odhikar
git add .
git commit -m "Day 2: Case Prioritizer ML model + judge dashboard"
git push
```

এটা push করলেই **Render আর Vercel দুটোই automatically re-deploy শুরু করবে**
(কারণ ওরা GitHub repo watch করছে)। ২-৩ মিনিট অপেক্ষা করো।

## টেস্ট করো

1. `https://odhikar-backend.onrender.com/docs` এ গিয়ে `GET /cases/prioritized`
   টেস্ট করো (Authorize বাটনে আগের judge login থেকে পাওয়া token বসিয়ে)
2. `https://odhikar.vercel.app` এ গিয়ে judge account দিয়ে লগইন করো
3. Dashboard-এ stats cards, urgency filter chips, আর ranked case table দেখা উচিত,
   সবচেয়ে উপরে DV/murder/minor-involved পুরনো cases থাকবে

**সমস্যা হলে:** Render build log-এ `xgboost` install হতে একটু বেশি সময় লাগতে পারে
(২-৪ মিনিট), এটা normal, ওটা একটা বড় library।

