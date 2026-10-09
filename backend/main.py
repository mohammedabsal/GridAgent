from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from backend.api.routes import router
from backend.config import settings
from backend.simulation.cloud_runtime import cloud_runtime
from backend.simulation.demo_scenarios import run_all_five_scenarios

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("gridagent.main")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting GridAgent-AI (%s mode)...", settings.grid_data_provider)
    if len(cloud_runtime.list_jobs()) == 0:
        logger.info("No existing workloads found in SQLite. Seeding initial 5 Demo Scenarios...")
        run_all_five_scenarios()
    yield
    logger.info("Shutting down GridAgent-AI...")


app = FastAPI(
    title="GridAgent-AI",
    description=(
        "Autonomous Multi-Agent Cloud Platform for Dynamic Grid Carbon Intensity "
        "& Enterprise Workload Orchestration (PERCEIVE -> REASON -> SAFETY CHECK -> EXECUTE)"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/info")
def api_info() -> dict[str, str]:
    return {
        "project": "GridAgent-AI",
        "concept": "Autonomous Multi-Agent Cloud Platform for Dynamic Grid Carbon Intensity & Enterprise Workload Orchestration",
        "architecture": "PERCEIVE -> REASON -> SAFETY CHECK -> EXECUTE",
        "docs_url": "/docs",
        "dashboard_api": "/api/dashboard",
    }


if (FRONTEND_DIST_DIR / "assets").is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")),
        name="frontend-assets",
    )


@app.get("/", response_model=None)
def root():
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return JSONResponse(api_info())


@app.get("/{full_path:path}", response_model=None, include_in_schema=False)
def serve_spa(full_path: str):
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.is_file():
        candidate = (FRONTEND_DIST_DIR / full_path).resolve()
        if (
            str(candidate).startswith(str(FRONTEND_DIST_DIR.resolve()))
            and candidate.is_file()
        ):
            return FileResponse(str(candidate))
        return FileResponse(str(index_file))
    return JSONResponse({"detail": "Not Found"}, status_code=404)


if __name__ == "__main__":
    port = int(os.getenv("PORT", str(settings.backend_port)))
    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=port,
        reload=False,
    )
