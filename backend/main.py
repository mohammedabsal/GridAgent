from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
def root() -> dict[str, str]:
    return {
        "project": "GridAgent-AI",
        "concept": "Autonomous Multi-Agent Cloud Platform for Dynamic Grid Carbon Intensity & Enterprise Workload Orchestration",
        "architecture": "PERCEIVE -> REASON -> SAFETY CHECK -> EXECUTE",
        "docs_url": "/docs",
        "dashboard_api": "/api/dashboard",
    }


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=False,
    )
