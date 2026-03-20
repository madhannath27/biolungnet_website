# BioLungNet — AI Lung Cancer Detection System

A fully functional React + Vite + TypeScript + Supabase web application for AI-powered lung cancer scan analysis.

---

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + TypeScript               |
| Build       | Vite 5                              |
| Styling     | Tailwind CSS v3 + custom CSS vars   |
| 3D Robot    | Three.js r170 (inline GLB parser)   |
| Backend DB  | Supabase (Auth + Postgres + Storage)|
| AI Backend  | FastAPI at `localhost:8000/predict` |

---

## Supabase Setup

1. Go to **Supabase → SQL Editor → New Query**
2. Paste and run the contents of `SUPABASE_SETUP.sql`
3. Go to **Supabase → Storage → New Bucket**
   - Name: `scan-images`
   - Public: **YES**
4. Go to **Supabase → Authentication → Providers → Email**
   - Disable "Confirm email" for local development

---

## AI Backend (Optional)

The app works without a backend — it falls back to **demo mode** with simulated results.

To use a real model, run a FastAPI server at `http://localhost:8000/predict` that:
- Accepts: `POST /predict` with `multipart/form-data` field `file`
- Returns:
```json
{
  "result": "Normal | Benign | Malignant",
  "confidence": 0.95,
  "probabilities": {
    "normal": 0.05,
    "benign": 0.03,
    "malignant": 0.92
  }
}
```

---

## Pages

| Route           | Page             |
|-----------------|------------------|
| `/`             | Login / Register |
| `/disclaimer`   | Medical Disclaimer |
| `/profile-setup`| Patient Profile  |
| `/upload`       | Scan Upload      |
| `/processing`   | AI Analysis      |
| `/result/:id`   | Results          |
| `/dashboard`    | Scan History     |

---

## Features

- **3D Robot** on the login screen (Three.js, GLB embedded)
- **Dot-connect cursor network** on the login page
- **Custom neon cursor** everywhere
- **Page transition animations** (slide in/out)
- **Real Supabase Auth** (email/password)
- **Image upload** to Supabase Storage
- **Scan results** saved to Supabase Postgres
- **Demo mode** auto-activates when backend is offline
- **Download report** as `.txt`
- **Delete scans** from dashboard
- **Fully responsive** (mobile-friendly)
