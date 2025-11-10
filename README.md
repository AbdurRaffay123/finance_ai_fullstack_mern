# FYP-AI-driven-Personal-Finance-Management-System

## Quick Start

### Frontend Server
```bash
npm run dev
```

### Backend Server
```bash
cd Finance_backend
node server.js
```

### FastAPI Server (REQUIRED for Predictions)
```bash
cd Finance_FastAPI
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**⚠️ Important:** FastAPI must be running for predictions to work! See `START_FASTAPI.md` for detailed instructions.

