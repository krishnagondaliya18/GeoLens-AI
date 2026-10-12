@echo off
echo ============================================================
echo Launching GeoLens Platform (Backend + Frontend)
echo ============================================================
start "GeoLens Backend (FastAPI)" cmd /k "cd /d C:\Users\khush\OneDrive\Desktop\Downloads\GeoLens\backend && python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "GeoLens Frontend (React / Vite)" cmd /k "cd /d C:\Users\khush\OneDrive\Desktop\Downloads\GeoLens\frontend && npm run dev"
echo GeoLens services launched.
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
pause
