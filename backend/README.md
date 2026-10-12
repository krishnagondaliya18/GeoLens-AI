# GeoLens Backend (`backend`)

High-performance FastAPI backend for **GeoLens**, powering natural-language interpretation of satellite and aerial imagery with multimodal Vision-Language Models (Google Gemini Vision / local VLM clusters).

---

## 🌟 Key Features

- **Multimodal Satellite Reasoning**: Powered natively by Google Gemini Vision (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) for instantaneous zero-shot satellite VQA without requiring dedicated multi-GPU infrastructure.
- **Intelligent Spatial Grounding**: Translates user queries into bounding box coordinates (`[ymin, xmin, ymax, xmax]`), highlights detected target objects, and generates visual annotations on imagery.
- **Object Counting & Enumeration**: Precise satellite object counting (ships, airplanes, storage tanks, vehicles, agricultural plots) with visual highlights.
- **Comprehensive Scene Captioning**: Generates technical remote sensing descriptions covering land use, sensor modality, road networks, waterways, and terrain.
- **Hybrid Engine Support**:
  - `gemini`: Google Gemini Vision API (Cloud-native, fast, no GPU needed).
  - `custom`: Local cluster proxying to GroundingDINO, SAM, and fine-tuned Qwen-VL.
  - `openai`: OpenAI-compatible vision endpoints.
- **CORS & Proxy Ready**: Built-in CORS support for Vite/React frontend and Nginx reverse proxying.

---

## 🚀 Getting Started

### 1. Requirements
Ensure Python 3.10+ is installed with the required packages:
```bash
pip install fastapi uvicorn httpx pillow python-dotenv python-multipart
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Google Gemini API key:
```env
API_MODE=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/)).*

### 3. Run the Backend Server
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is accessible at: `http://localhost:8000/docs`

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/handle` | `POST` | Core multimodal handler. Takes image file, prompt, and optional context. Generates VQA answers, bounding box overlays, and task-specific outputs. |
| `/api/eval` | `POST` | Benchmark evaluation endpoint for batch satellite queries (caption, grounding, attribute). |
| `/api/health` | `GET` | Health status and engine status check. |
| `/api/config` | `GET` | Active model and configuration metadata. |
