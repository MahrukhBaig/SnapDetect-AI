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

## 📊 Dashboard Features

* **🎨 Theme Toggle (Dark & Light Mode):** Fully functional, smooth-transitioning theme system that styles the global background, cards, tables, and browser scrollbars using root-synced CSS variables.
* **📈 Prominent KPI Analytics:** Metrics cards for **Total Batches**, **Files Processed**, and **Success Rate** styled with top-gradient borders, metric badges, and dynamic count-up animations on load.
* **📤 Drag & Drop Upload Handler:** High-fidelity upload box with drop-states. Small uploads (≤ 2 images) show high-res previews with removal controls; large queues (≥ 3 images) collapse to a summary badge to keep the layout neat.
* **🔍 Stripe-Style Inspect Drawer:** Slide-out details panel that displays real-time execution statistics, file-specific progress state logs, error messages, and a dynamic database search bar.
* **📋 Clipboard Helper:** Interactive clipboard helper that displays monospace Batch IDs with copy buttons appearing automatically on hover.
* **✨ Shine-Animated Excel Exporters:** Green download triggers featuring custom CSS shimmer animations that download consolidated spreadsheets on click.

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
