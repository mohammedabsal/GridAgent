# ==============================================================================
# Stage 1: Build React + Vite Frontend (frontend/dist)
# ==============================================================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Unified Python FastAPI Runtime serving both /api/* and React SPA
# ==============================================================================
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_NAME="GridAgent-AI" \
    GRID_DATA_PROVIDER="SIMULATION" \
    CLOUD_RUNTIME_PROVIDER="SIMULATED_K8S" \
    DATABASE_URL="sqlite:///./gridagent.db"

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app/backend
COPY tests /app/tests
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

