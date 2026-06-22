<div align="center">

<br/>

# 🙏 Pray For Me

### Your personal Christian prayer companion

*"Pray without ceasing." — 1 Thessalonians 5:17*

<br/>

[![React](https://img.shields.io/badge/React_18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)](LICENSE)

<br/>

> A private, multilingual prayer journal powered by AI — helping you pray deeper, track God's answers, and never forget a prayer request.

<br/>

</div>

---

## ✨ Features

### 🗂️ Prayer Management
- Add personal prayer requests with title, description, and categories
- Pray **for others** — attach a person's name and phone number
- Mark prayers as **answered** and record your testimony
- Resume answered prayers back to active if needed

### 🤖 AI-Powered Prayer Points
- Get Claude AI-suggested prayer topics with **multiple Bible verses** per point
- Each verse shown with full text and a direct link to Bible.com
- Add prayer points **manually** without needing AI
- Attach additional Bible verses to any prayer point at any time

### 📋 Prayer Detail Page
- Full-page view for each prayer with all its updates, prayer points, and testimony
- Smooth navigation with a back arrow — no page reload

### 📅 Weekly Prayer Plan
- Create categories (Family, Health, Church, Work…) with custom emoji and color
- Assign each category to specific days of the week
- Today's tab shows only what's planned for today

### 🌍 Multilingual Interface
- Full UI in **French, English, German, and Portuguese**
- Every label, tooltip, and button adapts to the selected language
- AI suggestions are generated in the user's language

### 🌙 Light & Dark Mode
- Toggle between light and dark themes
- Preference saved to `localStorage` and applied instantly

### 🔔 Smart Notifications
- Daily prayer reminder at a chosen time
- Prayer follow-up prompts (every 3 days → monthly)
- Call reminder for people you pray for
- All via native browser Web Notifications API

### 🔒 Private & Secure
- Auth via Google OAuth or Email/Password (Supabase Auth)
- All data stored in your own Supabase database with Row Level Security
- Nobody else can see your prayers

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Arthuro1/pray-for-me.git
cd pray-for-me

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=your-claude-api-key   # optional — AI features only
```

> **Note:** The Anthropic key is only used in development. In production, route AI calls through your own backend to keep the key secret.

---

## 🗄️ Database Setup

Run [`supabase_schema.sql`](./supabase_schema.sql) in your Supabase SQL editor to create all tables and RLS policies.

If upgrading an existing database, also run the migration comments at the bottom of the schema file (adds the `verses jsonb` column to `prayer_points`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| UI | [React 18](https://react.dev) + [Tailwind CSS 3](https://tailwindcss.com) |
| Build | [Vite](https://vitejs.dev) |
| State | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| Backend / Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS) |
| AI | [Claude Haiku](https://anthropic.com) via Anthropic API |
| Icons | [Lucide React](https://lucide.dev) |
| Dates | [date-fns](https://date-fns.org) |
| Analytics | [@vercel/speed-insights](https://vercel.com/docs/speed-insights) |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # Sidebar navigation + FAB
│   ├── PrayerCard.jsx      # Expandable prayer card (grid view)
│   └── PrayerForm.jsx      # Add / edit prayer modal
├── pages/
│   ├── HomeTab.jsx         # Today's dashboard (verse, stats, plan)
│   ├── PrayersTab.jsx      # Full prayer list with search & filters
│   ├── PrayerDetail.jsx    # Full-page prayer detail with AI points
│   ├── PlanTab.jsx         # Weekly plan & category management
│   ├── SettingsTab.jsx     # Language, theme, notifications, account
│   └── AuthPage.jsx        # Login / register
├── store/
│   ├── prayerStore.js      # All prayer data & actions (Zustand)
│   ├── authStore.js        # Auth state (Supabase session)
│   └── translationStore.js # Dynamic content translation cache
├── i18n.js                 # Static UI translations (fr/en/de/pt)
├── aiRecommendations.js    # Claude API integration
├── notifications.js        # Web Notifications scheduling
└── App.jsx                 # Root component + theme init
```

---

## 🌐 Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

```bash
npm run build   # outputs to dist/
```

Set the same environment variables in your Vercel project settings. The `api/` folder contains a serverless function that proxies Anthropic API calls securely in production.

---

## 🙌 Contributing

Contributions are welcome!

1. Fork the project
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

<br/>

Built with ❤️ and faith

*"I can do all things through him who strengthens me." — Philippians 4:13*

<br/>

</div>
