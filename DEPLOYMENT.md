# SnapDetect AI — Production Deployment Guide

This guide details how to deploy the SnapDetect AI codebase to production. The frontend will be hosted on **Vercel** (global static CDN) and the backend API on **Render** or **Railway** (persistent containers to support long-running background tasks).

---

## 1. Prerequisites

Before starting, ensure you have:
1. A **GitHub** repository containing your code.
2. A **Supabase** account with your database schema set up.
3. A **Google Gemini API Key** for processing images.

---

## 2. Backend Deployment (Render or Railway)

Since the backend runs background extraction tasks using FastAPI's async loops, it requires a host that supports **persistent, non-serverless processes**.

### Option A: Render.com
1. Log in to [Render.com](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `snapdetect-api`
   - **Environment:** `Python`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Expand the **Advanced** section and add the following **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `SUPABASE_URL`: *(Your Supabase URL)*
   - `SUPABASE_KEY`: *(Your Supabase Service Role API Key)*
   - `FRONTEND_URL`: `https://your-app-name.vercel.app` *(Add this after deploying your frontend)*
5. Click **Create Web Service**. Render will build and deploy the backend. Copy the generated Web Service URL (e.g., `https://snapdetect-api.onrender.com`).

### Option B: Railway.app
1. Log in to [Railway.app](https://railway.app) and click **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. Under the service settings, set the **Root Directory** to `backend`.
4. Railway will automatically detect the Python configuration and `requirements.txt`. Set the **Start Command** to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Go to the **Variables** tab and insert the required variables:
   - `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL`
6. Click Deploy. Railway will provision a public URL for your backend.

---

## 3. Frontend Deployment (Vercel)

Vercel provides ultra-fast static hosting optimized for Vite/React applications.

1. Log in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Configure the framework settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
4. Add the following **Environment Variable**:
   - `VITE_API_URL`: *(Your deployed Render or Railway Backend Service URL, e.g., `https://snapdetect-api.onrender.com`)*
5. Click **Deploy**. Vercel will build your static assets and publish them live.
6. Once deployed, copy your Vercel deployment URL (e.g., `https://snapdetect-ai.vercel.app`) and add/update it as the `FRONTEND_URL` variable in your Render or Railway backend settings to ensure secure CORS configuration.

---

## 4. Production Database Configuration

Ensure that your Supabase instance is configured with tables:
- `batches`: Holds batch tracking metadata.
- `extracted_images`: Holds individual image logs linked via foreign key `batch_id`.
- `extracted_data`: Holds parsed structured specifications linked via foreign key `image_id`.

Your backend automatically coordinates inserts and updates directly. No additional schema migrations are necessary.
