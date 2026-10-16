# ODHIKAR: নিজের কম্পিউটারে চালানো (সম্পূর্ণ ফ্রি, কোনো Account লাগবে না)

এই গাইড follow করলে backend + frontend দুটোই তোমার নিজের PC-তে চলবে। কোনো টাকা লাগবে না,
কোনো signup লাগবে না, কোনো card লাগবে না। Database হিসেবে SQLite ব্যবহার করবো। এটা
Python-এর সাথেই built-in থাকে, আলাদা install করারও দরকার নেই।

**Terminal মানে কী:** Windows-এ "Command Prompt" বা "PowerShell" বা "Git Bash",
Mac-এ "Terminal" app। VS Code ব্যবহার করলে তার ভেতরেই "Terminal" ট্যাব আছে (উপরে
মেনু থেকে Terminal → New Terminal)।

---

## ধাপ ০: যা install করা লাগবে (একবারই)

- [Python 3.11+](https://www.python.org/downloads/), install করার সময় "Add Python to PATH" টিক দিয়ে দিও
- [Node.js LTS](https://nodejs.org), এটাই npm সাথে নিয়ে আসে

Install হয়ে গেলে terminal-এ চেক করো:
```bash
python --version
node --version
```
সংখ্যা দেখালেই ঠিক আছে।

---

## ধাপ ১: Zip ফাইল extract করো

`odhikar-day3.zip` ফাইলটা extract করো (right-click → Extract All, বা Mac-এ ডাবল ক্লিক)।
এটা একটা `odhikar` ফোল্ডার তৈরি করবে, যার ভেতরে `backend/` আর `frontend/` আছে।

---

## ধাপ ২: Backend চালাও

Terminal খুলে `odhikar` ফোল্ডারে যাও:

```bash
cd path/to/odhikar/backend
```

(`path/to/` জায়গায় তুমি যেখানে extract করেছো সেই পুরো path বসাও। সহজ উপায়: ফোল্ডারটা
File Explorer/Finder-এ খুলে address bar থেকে path কপি করো, অথবা ফোল্ডারটা terminal
window-এর ভেতর drag করে ছেড়ে দিলেও path বসে যায়।)

এবার একটা isolated Python environment বানাও (এটা তোমার আসল কম্পিউটারের Python-কে
নোংরা করবে না, সব এখানেই থাকবে):

```bash
python -m venv venv
```

Environment টা activate করো:

- **Mac / Linux:**
  ```bash
  source venv/bin/activate
  ```
- **Windows (Command Prompt):**
  ```bash
  venv\Scripts\activate.bat
  ```
- **Windows (PowerShell):**
  ```bash
  venv\Scripts\Activate.ps1
  ```

Activate হলে terminal লাইনের শুরুতে `(venv)` দেখা যাবে।

এবার সব package install করো (প্রথমবার ২-৪ মিনিট লাগতে পারে, xgboost বড় library):

```bash
pip install -r requirements.txt
```

এবার `.env` নামে একটা ফাইল বানাও `backend` ফোল্ডারের ভেতরে (Notepad/VS Code দিয়ে বানাও,
নিচের ৩ লাইন হুবহু লিখে সেভ করো):

```
DATABASE_URL=sqlite:///./odhikar.db
JWT_SECRET=my-local-test-secret-123
CORS_ORIGINS=http://localhost:5173
```

AI Summarizer আর NagorikBot চালাতে চাইলে নিচের লাইনটাও যোগ করো (optional, ছাড়াও চলবে):
```
ANTHROPIC_API_KEY=sk-ant-তোমার-key-এখানে
```
(Free $5 credit পেতে https://console.anthropic.com এ signup করো। Key না দিলেও app কাজ করবে, Summarizer relevant laws দেখাবে, Bot fallback message দেবে।)

এবার database-এ sample case data ঢোকাও (একবারই লাগবে, একটা `odhikar.db` ফাইল তৈরি হবে
এই ফোল্ডারেই):

```bash
python -m app.seed
```

`Seeded 5 courts and 500 synthetic cases.` দেখা গেলে ঠিক আছে।

এবার backend server চালু করো:

```bash
uvicorn app.main:app --reload --port 8000
```

`Uvicorn running on http://0.0.0.0:8000` এরকম কিছু দেখলে backend চলছে। **এই terminal
window বন্ধ কোরো না**। এটা চলতেই থাকবে যতক্ষণ তুমি ব্যবহার করবে।

ব্রাউজারে খুলে চেক করো: **http://localhost:8000/docs**। এখানে সব API endpoint দেখা যাবে।

---

## ধাপ ৩: Frontend চালাও (নতুন Terminal window খোলো)

⚠️ আগের terminal বন্ধ কোরো না (ওটা backend চালাচ্ছে)। **নতুন একটা Terminal window/tab খোলো।**

```bash
cd path/to/odhikar/frontend
```

`.env` ফাইল বানাও `frontend` ফোল্ডারে, ভেতরে এক লাইন:

```
VITE_API_URL=http://localhost:8000
```

Package install করো:

```bash
npm install
```

Frontend চালু করো:

```bash
npm run dev
```

`Local: http://localhost:5173/` দেখা গেলে ঠিক আছে। ব্রাউজারে খুলো:
**http://localhost:5173**

তোমার "অধিকার" লগইন পেজ দেখা যাবে।

---

## ধাপ ৪: প্রথম judge account বানাও এবং টেস্ট করো

Login UI-তে এখনো signup বাটন নেই, তাই backend-এর নিজের docs page থেকে একবার
account বানাতে হবে:

1. **http://localhost:8000/docs** এ যাও
2. `GET /courts` খুলে **Try it out** → **Execute**, একটা `id` কপি করো
3. `POST /auth/judge/signup` খুলে **Try it out**, নিচের মতো বসাও:
   ```json
   {
     "name": "Justice Rahman",
     "email": "judge@test.com",
     "password": "test1234",
     "court_id": "এখানে কপি করা id বসাও"
   }
   ```
4. **Execute** চাপো, account তৈরি হয়ে গেলো

এবার **http://localhost:5173** এ গিয়ে Landing page দেখা যাবে। "বিচারক লগইন" চাপো, তারপর
"বিচারক" ট্যাবে `judge@test.com` / `test1234` দিয়ে লগইন করো।

Dashboard-এ ranked case list, stats, filter, সব দেখা যাবে। 🎉

### নতুন features (Day 3):
- **Dashboard থেকে কোনো case-এ ক্লিক করো** → Case Detail page, "AI বিশ্লেষণ করুন" button
- **Navbar-তে "নাগরিকবট" ক্লিক করো** → NagorikBot chat UI, quick action buttons

---

## পরের বার চালানোর সময়

প্রতিদিন নতুন করে সব করতে হবে না। শুধু:

**Backend (terminal ১):**
```bash
cd path/to/odhikar/backend
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Frontend (terminal ২, নতুন window):**
```bash
cd path/to/odhikar/frontend
npm run dev
```

`.env` ফাইল আর `venv`/`node_modules` থেকেই যাবে, `pip install` / `npm install`
আর লাগবে না।

---

## সমস্যা হলে

- **`python: command not found`** → Python install হয়নি ঠিকমতো, বা PATH-এ যোগ হয়নি। আবার install করো, "Add to PATH" টিক দিয়ে।
- **`ModuleNotFoundError`** → venv activate করা হয়নি, বা `pip install -r requirements.txt` চালানো হয়নি। `(venv)` terminal-এ দেখা যাচ্ছে কিনা চেক করো।
- **Frontend-এ "Network Error" / login কাজ করছে না** → backend-এর terminal windowটা চলছে কিনা দেখো, আর `.env` ফাইলে ঠিক URL আছে কিনা।
- **`port already in use`** → আগের একটা terminal-এ backend/frontend আগে থেকেই চলছে হয়তো, সেটা বন্ধ করো (Ctrl+C) অথবা অন্য port ব্যবহার করো (`--port 8001`)

exact error message পেলে আমাকে paste করে দিও, সাথে সাথে ঠিক করে দেব।

---

## Live link কবে লাগবে?

এখনই লাগবে না। Demo video তোমার নিজের screen record করেই বানানো যায় (localhost দেখিয়ে)।
পরে যদি সবাইকে সহজে link শেয়ার করতে চাও (বা judge-রা নিজে থেকে টেস্ট করুক চাও), তখন
`SETUP.md`-এর cloud deploy অংশ follow করলেই হবে, সেটাও সম্পূর্ণ ফ্রি (Render + Vercel +
Supabase), কোনো card লাগে না।
