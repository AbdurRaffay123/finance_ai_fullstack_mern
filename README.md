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

# Install dependencies (if not already installed)
pip3 install -r requirements.txt

# Start FastAPI server
python3 -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**⚠️ Important:** FastAPI must be running for predictions to work!

**Note:** If you have a virtual environment, you can activate it first:
```bash
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```
Then run: `uvicorn app:app --reload --port 8000`

