# 🔖 SmartMark - Real-Time Bookmark Manager

SmartMark is a premium, minimalist web application built with **Next.js 15 (App Router)** and **Supabase**. It allows users to instantly save, organize, and search their favorite web resources with real-time synchronization across all devices.

![image](https://img.shields.io/badge/Next.js-15-black)
![image](https://img.shields.io/badge/Tailwind-CSS-indigo)
![image](https://img.shields.io/badge/Supabase-Backend-green)
![image](https://img.shields.io/badge/Lucide-Icons-indigo)

---

## ✨ Features

- **Google OAuth Login**: Secure and seamless authentication.
- **Real-Time Sync**: Add or delete bookmarks in one tab and see them update instantly in others.
- **Optimistic UI**: Lightning-fast feedback when adding or removing links.
- **Fast Search**: Instant filtering of your collection by title or URL.
- **Premium Design**: Vibrant Indigo theme with a focus on responsiveness and minimalist aesthetics.
- **Zero Gradients**: Clean, professional design language using solid colors and modern shadows.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS.
- **Backend/Auth**: Supabase (PostgreSQL + Auth + Realtime).
- **Icons**: Lucide React.
- **Styling**: Modern CSS with smooth transitions and micro-animations.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Supabase account

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema
Run this in your Supabase SQL Editor:
```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable RLS & Realtime
alter table bookmarks enable row level security;
alter publication supabase_realtime add table bookmarks;
```

### 4. Installation
```bash
npm install
npm run dev
```

---

## 🧠 Problem i Faced while building this

Building a real-time application with a premium feel comes with its own set of "human" challenges. Here are the hurdles I encountered and how I solved them:

### 1. The "Ghost" Updates (Real-Time Sync)
**Problem**: At first, deleting a bookmark in one tab didn't reflect in the other without a refresh. Worse, sometimes the UI would duplicate items when a new one was added because both the local state and the Real-Time listener were trying to update the list.
**Solution**: I implemented **Optimistic UI updates** combined with a deduplication check in the Real-Time effect. Now, the app "predicts" the outcome locally first, and the Real-Time listener gracefully ignores updates that it already knows about.

### 2. The Login "Loop"
**Problem**: During development, I found a bug where logged-in users would briefly see the landing page before being redirected, creating an annoying flicker.
**Solution**: I added a proper session loading state with a clean spinner. I also implemented `onAuthStateChange` listeners so that the app reacts instantly to auth state changes without unnecessary page reloads.

### 3. Responsive Layout "Breaking"
**Problem**: When things got busy (many bookmarks) or the screen got small (mobile), the URLs would overlap the delete buttons, or the bookmark count badge would wrap into two ugly lines.
**Solution**: I used Tailwind's `truncate` and `min-w-0` properties to handle long strings gracefully. I also added `whitespace-nowrap` to the count badge and switched to flex-column stacking on mobile to give every element its own breathing room.

### 4. The "Dull" Aesthetic
**Problem**: Initially, the app used a standard black-and-white theme. While "minimalist," it felt sterile and lacked character for an app users should enjoy using every day.
**Solution**: I pivoted to a vibrant **Indigo-centric** design system. By using subtle shades of indigo for backgrounds and borders, and a high-contrast Indigo-600 for actions, the app now feels "Premium" and alive without needing complex gradients.

---

## 📜 License
Distibuted under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for better web organization.*
