# SnapDetect AI — Intelligent Packaging Details Extractor

SnapDetect AI is a premium, enterprise-grade B2B SaaS dashboard designed to extract structured nutritional and retail metadata from product packaging images. Powered by **FastAPI** (Python) and **React** (Vite), it integrates **Google Gemini 2.5 Flash** for high-accuracy structured visual analysis and **Supabase (PostgreSQL)** for secure database storage.

---

## 🎨 Premium User Experience & Features

### 1. Striking B2B SaaS Design Language
* **Linear & Stripe Inspired:** Minimalist, sleek borders, custom geometric layouts, and frosted glass components.
* **SVG-Driven UI:** Clean vector illustrations and iconography using the **Lucide React** library.
* **Integrated Theme System:** Toggle between deep slate dark mode and clean white light mode with a smooth `300ms` CSS transition. The theme class syncs directly to the `html` root node for clean browser scrollbars and global body background transitions.

### 2. Prominent Analytics KPIs
* **Metric Cards:** Total Batches, Files Processed, and overall Success Rate.
* **High-Fidelity Touches:** Beautiful top-gradient accent borders, color-coded custom icon badges, descriptive subtext labels, and animated counters that count up on page load.
* **Real-Time Calculation:** Automatically updates in real time as jobs progress or finish in the background.

### 3. Asynchronous Batch Uploads
* **Dropzone:** Drag-and-drop or browse files with visual dragging states and thumbnail previews.
* **Dynamic Previews:** Displays item counts, filenames, and sizes for small queues ($\le 2$ files); collapses into a unified queue status badge for large queues ($\ge 3$ files).
* **Decoupled Architecture (HTTP 202):** Immediate batch queuing response allows heavy AI extraction processes to run asynchronously in background thread loops without frontend freezes.

### 4. Interactive Inspection Drawer
* **Sliding Details Panel:** Clicking **Inspect** on any historical run slides out a detailed B2B drawer showing progress status, metric summaries, and a filterable search table of individual files.
* **Clipboard Helper:** Monospace Batch IDs with quick copy-to-clipboard buttons on hover.
* **Status Badges:** Color-coded status pills representing `PROCESSING`, `COMPLETED`, or `FAILED` runs.

### 5. Multi-Tab Excel Reports
* **Consolidated Data:** Downloads a professionally formatted `.xlsx` spreadsheet directly from the dashboard.
* **Data Pipelines:** Merges files, image paths, timestamps, and structured JSON fields into custom worksheets.

---

## 🏗️ Architecture & Data Flow

```
[ React Client (Vercel) ]
         │
         ▼ (Fetch requests / Form Data uploads)
[ FastAPI Backend (Railway) ]
         │
         ├───► [ Google Gemini 2.5 Flash ] ───► (Structured JSON extraction)
         │
         └───► [ Supabase PostgreSQL ] ────► (Metadata & transaction storage)
```

---

## 🛠️ Local Development Setup

### 1. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` folder:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Run the FastAPI development server:
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
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the dashboard in your browser at `http://localhost:5173/`.
