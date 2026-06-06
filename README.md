# ⚡ SnapDetect AI: Asynchronous B2B SaaS OCR Engine for Packaging Metadata Extraction

SnapDetect AI is an enterprise-grade, serverless AI system designed to extract structured nutritional specs and ingredient metadata from product packaging images. By combining **FastAPI (Python)**, **React (Vite)**, **Google Gemini 2.5 Flash**, and **Supabase (PostgreSQL)**, the platform establishes a high-performance, asynchronous pipeline for automated retail data ingestion.

---

## 🔗 Live Production Gateway

👉 🚀 **[Live Dashboard Gateway](https://snapdetect-ai.vercel.app)**

[![Vercel Live Dashboard](https://img.shields.io/badge/Vercel-Live_Dashboard-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://snapdetect-ai.vercel.app)
[![FastAPI Backend API](https://img.shields.io/badge/FastAPI-Backend_API-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://snapdetect-ai-production.up.railway.app)
[![Supabase Database](https://img.shields.io/badge/Supabase-PostgreSQL_Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

---

## 🏗️ Production System Architecture

```
[ React Client (Vercel CDN) ]
             │
             ▼ (Async REST Requests / Multipart Form Upload)
   [ FastAPI Backend (Railway Server) ]
             │
             ├───► [ Google Gemini 2.5 Flash API ] ───► (OCR & Semantic Schema Parsing)
             │
             └───► [ Supabase PostgreSQL ] ──────────► (Transaction Logs & Details)
```

1. **Instant Queue (HTTP 202):** Image uploads are processed asynchronously in background worker threads, returning a tracking ID immediately to prevent request timeouts.
2. **Strict Schema Enforcement:** Gemini's vision model is restricted to a Pydantic output schema, guaranteeing 100% valid database insertions.
3. **In-Memory Streams:** Excel reports are generated on-the-fly in a `BytesIO` buffer and streamed directly, preventing server disk space bloat.

---

## ⚙️ Core Tech Stack

* **Frontend:** React (Vite), Tailwind CSS (Base), CSS Variables (Theme System), Lucide Icons
* **Backend:** FastAPI (Python), Uvicorn, SlowAPI (Rate Limiting)
* **Database:** Supabase (PostgreSQL)
* **AI Model:** Google Gemini 2.5 Flash API (Pydantic Response Schemas)
* **Report Engine:** Pandas, OpenPyXL
* **Hosting:** Vercel (Frontend), Railway (Backend)

---

## 🎨 Key Core Features

* **Linear-Grade Interface:** Sleek glassmorphism layouts, clean micro-interactions, and zero emojis in the dashboard UI.
* **Smart Upload Queue:** Displays thumbnail previews with removal controls for $\le 2$ images, collapsing into a queue count status badge for $\ge 3$ images.
* **Stripe-Style Details Drawer:** Click **Inspect** to slide out a side drawer showing real-time batch statistics and search-filterable records.
* **Premium Theme Selector:** Toggles smooth light and dark modes via root-synced CSS variables.

---

## 🛠️ Local Development Setup

### 1. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` variables:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Run the dev server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
