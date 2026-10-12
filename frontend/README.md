# GeoLens Frontend (`frontend`)

High-tech, mission-control user interface for **GeoLens**, built with React 19, Vite, and Tailwind CSS. Enables intuitive, natural-language interaction with satellite imagery, interactive canvas manipulation, object grounding visualization, and comprehensive analysis logging.

---

## 🌟 Key Features

- **Interactive Satellite Canvas**:
  - Full-resolution imagery viewer with pan, zoom (up to 5x), 90° rotation, and horizontal flip controls.
  - Interactive rectangular region cropping for localized analysis.
  - Image gallery / history reel caching previous analyses and transformed imagery states.
- **AI-Powered Geospatial Analysis**:
  - Direct multimodal conversational queries powered by Google Gemini Vision.
  - Bounding box grounding with color-coded overlays and confidence labels.
  - Transparent reasoning inspection (`Thought Process` accordion).
  - Quick automatic scene captioning upon image ingest.
- **Client-Side Engine Controls**:
  - Built-in Gemini Engine Settings modal to configure API key and select models (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
  - Persistent browser-level mission logs stored via `localStorage`.

---

## 🚀 Getting Started

### 1. Requirements
Ensure Node.js 18+ and npm are installed.

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Production Build
```bash
npm run build
```
Build output is generated in the `dist/` folder, ready for deployment via Nginx or static web hosting.