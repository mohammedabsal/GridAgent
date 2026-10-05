from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Centralized configuration for GridAgent-AI."""

    app_name: str = os.getenv("APP_NAME", "GridAgent-AI")
    app_env: str = os.getenv("APP_ENV", "development")
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./gridagent.db")

    # Clearly distinguish SIMULATION vs LIVE_API
    grid_data_provider: str = os.getenv("GRID_DATA_PROVIDER", "SIMULATION")
    cloud_runtime_provider: str = os.getenv("CLOUD_RUNTIME_PROVIDER", "SIMULATED_K8S")

    # Gemini / Antigravity AI settings
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    use_antigravity_sdk: bool = os.getenv("USE_ANTIGRAVITY_SDK", "false").lower() == "true"

    # External Grid API credentials (for future real-world telemetry integration)
    electricity_maps_api_key: str = os.getenv("ELECTRICITY_MAPS_API_KEY", "")
    electricity_maps_zone: str = os.getenv("ELECTRICITY_MAPS_ZONE", "IN-WE")

    # Safety & Governance thresholds
    safety_cost_limit_usd: float = float(os.getenv("SAFETY_COST_LIMIT_USD", "500.0"))
    safety_energy_limit_kwh: float = float(os.getenv("SAFETY_ENERGY_LIMIT_KWH", "500.0"))
    safety_min_deadline_slack_minutes: int = int(
        os.getenv("SAFETY_MIN_DEADLINE_SLACK_MINUTES", "15")
    )


settings = Settings()
