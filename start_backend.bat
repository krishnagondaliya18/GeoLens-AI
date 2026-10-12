@echo off
echo ============================================================
echo Starting GeoLens FastAPI Backend Server...
echo ============================================================
cd /d "C:\Users\khush\OneDrive\Desktop\Downloads\GeoLens\backend"
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
pause
