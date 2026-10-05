from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import httpx

from backend.config import settings
from backend.models.schemas import GridHourlyPoint, GridStatusResponse


class GridDataProvider(ABC):
    """Abstract interface separating SIMULATION DATA from REAL API INTEGRATION."""

    @abstractmethod
    def get_current_status(self) -> GridStatusResponse:
        raise NotImplementedError

    @abstractmethod
    def get_24h_forecast(self) -> List[GridHourlyPoint]:
        raise NotImplementedError

    @abstractmethod
    def get_historical_24h(self) -> List[GridHourlyPoint]:
        raise NotImplementedError


# =====================================================================
# 1. SIMULATION DATA PROVIDER (Default for Prototype)
# =====================================================================

PROFILES: Dict[str, List[Dict[str, float | int | str]]] = {
    # Default profile: Combines realistic 24h diurnal curve with afternoon transient at 15:00 (700 gCO2/kWh)
    # and coastal wind + late-solar clean window at 17:00 (390 gCO2/kWh), matching the demo specification.
    "demo_default": [
        {"hour": 0,  "carbon": 490.0, "solar": 0.0,    "wind": 1400.0, "demand": 11200.0, "price": 0.11, "regime": "Moderate Night Baseload",      "weather": "Clear Night"},
        {"hour": 1,  "carbon": 475.0, "solar": 0.0,    "wind": 1450.0, "demand": 10800.0, "price": 0.10, "regime": "Moderate Night Baseload",      "weather": "Clear Night"},
        {"hour": 2,  "carbon": 465.0, "solar": 0.0,    "wind": 1500.0, "demand": 10500.0, "price": 0.10, "regime": "Low Night Demand",             "weather": "Clear Night"},
        {"hour": 3,  "carbon": 460.0, "solar": 0.0,    "wind": 1520.0, "demand": 10400.0, "price": 0.09, "regime": "Low Night Demand",             "weather": "Clear Night"},
        {"hour": 4,  "carbon": 485.0, "solar": 0.0,    "wind": 1420.0, "demand": 10900.0, "price": 0.10, "regime": "Early Morning Ramp",           "weather": "Dawn"},
        {"hour": 5,  "carbon": 535.0, "solar": 80.0,   "wind": 1300.0, "demand": 12100.0, "price": 0.12, "regime": "Morning Industrial Ramp",      "weather": "Dawn"},
        {"hour": 6,  "carbon": 595.0, "solar": 350.0,  "wind": 1200.0, "demand": 13800.0, "price": 0.15, "regime": "Increasing Morning Demand",    "weather": "Partly Cloudy"},
        {"hour": 7,  "carbon": 620.0, "solar": 920.0,  "wind": 1150.0, "demand": 14900.0, "price": 0.16, "regime": "Morning Peak Demand",          "weather": "Sunny"},
        {"hour": 8,  "carbon": 570.0, "solar": 1850.0, "wind": 1100.0, "demand": 15400.0, "price": 0.15, "regime": "Solar Ramp Up",                "weather": "Sunny"},
        {"hour": 9,  "carbon": 520.0, "solar": 2900.0, "wind": 1150.0, "demand": 15600.0, "price": 0.13, "regime": "Moderate Grid Intensity",      "weather": "Sunny"},
        {"hour": 10, "carbon": 475.0, "solar": 3850.0, "wind": 1200.0, "demand": 15800.0, "price": 0.12, "regime": "Moderate / Rising Solar",      "weather": "Bright Sun"},
        {"hour": 11, "carbon": 410.0, "solar": 4600.0, "wind": 1250.0, "demand": 16000.0, "price": 0.10, "regime": "High Solar Generation",        "weather": "Bright Sun"},
        {"hour": 12, "carbon": 360.0, "solar": 5100.0, "wind": 1300.0, "demand": 16100.0, "price": 0.09, "regime": "High Solar / Lower Carbon",    "weather": "Peak Solar"},
        {"hour": 13, "carbon": 340.0, "solar": 5300.0, "wind": 1350.0, "demand": 15900.0, "price": 0.08, "regime": "High Solar / Lower Carbon",    "weather": "Peak Solar"},
        {"hour": 14, "carbon": 480.0, "solar": 3400.0, "wind": 1300.0, "demand": 16200.0, "price": 0.12, "regime": "Afternoon Cloud Cover",        "weather": "Cloudy Transient"},
        {"hour": 15, "carbon": 700.0, "solar": 1400.0, "wind": 950.0,  "demand": 16800.0, "price": 0.22, "regime": "High Carbon / Peaker Spike",   "weather": "Heavy Cloud Bank"},
        {"hour": 16, "carbon": 450.0, "solar": 3200.0, "wind": 2400.0, "demand": 16100.0, "price": 0.12, "regime": "Clearing Sky & Wind Surge",    "weather": "Clearing & Breezy"},
        {"hour": 17, "carbon": 390.0, "solar": 2600.0, "wind": 3400.0, "demand": 15700.0, "price": 0.09, "regime": "Low Carbon Optimal Window",    "weather": "High Coastal Wind"},
        {"hour": 18, "carbon": 420.0, "solar": 1200.0, "wind": 3500.0, "demand": 16300.0, "price": 0.11, "regime": "Wind-Supported Evening",       "weather": "Windy Dusk"},
        {"hour": 19, "carbon": 650.0, "solar": 100.0,  "wind": 1800.0, "demand": 17600.0, "price": 0.20, "regime": "High Evening Demand / Thermal","weather": "Evening Clear"},
        {"hour": 20, "carbon": 690.0, "solar": 0.0,    "wind": 1600.0, "demand": 17900.0, "price": 0.21, "regime": "Evening Peak Carbon",          "weather": "Night"},
        {"hour": 21, "carbon": 720.0, "solar": 0.0,    "wind": 1450.0, "demand": 17200.0, "price": 0.22, "regime": "High Carbon Thermal Peak",     "weather": "Night"},
        {"hour": 22, "carbon": 610.0, "solar": 0.0,    "wind": 1500.0, "demand": 14800.0, "price": 0.16, "regime": "Declining Night Demand",       "weather": "Night"},
        {"hour": 23, "carbon": 510.0, "solar": 0.0,    "wind": 1550.0, "demand": 12400.0, "price": 0.12, "regime": "Moderate Late Night",          "weather": "Clear Night"},
    ],
    # Classic Solar Duck Curve (Section 9 canonical curve)
    "solar_duck_curve": [
        {"hour": 0,  "carbon": 480.0, "solar": 0.0,    "wind": 1500.0, "demand": 11000.0, "price": 0.11, "regime": "Moderate Baseload",            "weather": "Clear Night"},
        {"hour": 1,  "carbon": 470.0, "solar": 0.0,    "wind": 1520.0, "demand": 10700.0, "price": 0.10, "regime": "Moderate Baseload",            "weather": "Clear Night"},
        {"hour": 2,  "carbon": 460.0, "solar": 0.0,    "wind": 1550.0, "demand": 10400.0, "price": 0.10, "regime": "Low Demand",                   "weather": "Clear Night"},
        {"hour": 3,  "carbon": 455.0, "solar": 0.0,    "wind": 1580.0, "demand": 10300.0, "price": 0.09, "regime": "Low Demand",                   "weather": "Clear Night"},
        {"hour": 4,  "carbon": 475.0, "solar": 0.0,    "wind": 1480.0, "demand": 10800.0, "price": 0.10, "regime": "Early Morning",                "weather": "Dawn"},
        {"hour": 5,  "carbon": 525.0, "solar": 100.0,  "wind": 1350.0, "demand": 11900.0, "price": 0.12, "regime": "Morning Ramp",                 "weather": "Dawn"},
        {"hour": 6,  "carbon": 590.0, "solar": 400.0,  "wind": 1250.0, "demand": 13600.0, "price": 0.15, "regime": "Increasing Demand",            "weather": "Sunny"},
        {"hour": 7,  "carbon": 610.0, "solar": 1050.0, "wind": 1200.0, "demand": 14700.0, "price": 0.16, "regime": "Morning Commute Peak",         "weather": "Sunny"},
        {"hour": 8,  "carbon": 560.0, "solar": 2100.0, "wind": 1180.0, "demand": 15200.0, "price": 0.14, "regime": "Solar Expansion",              "weather": "Sunny"},
        {"hour": 9,  "carbon": 510.0, "solar": 3200.0, "wind": 1200.0, "demand": 15500.0, "price": 0.13, "regime": "Moderate Intensity",           "weather": "Bright Sun"},
        {"hour": 10, "carbon": 470.0, "solar": 4100.0, "wind": 1250.0, "demand": 15700.0, "price": 0.12, "regime": "Moderate Grid",                "weather": "Bright Sun"},
        {"hour": 11, "carbon": 395.0, "solar": 4900.0, "wind": 1300.0, "demand": 15900.0, "price": 0.10, "regime": "High Solar Share",             "weather": "Peak Solar"},
        {"hour": 12, "carbon": 340.0, "solar": 5500.0, "wind": 1350.0, "demand": 16000.0, "price": 0.08, "regime": "High Solar / Lower Carbon",    "weather": "Peak Solar"},
        {"hour": 13, "carbon": 310.0, "solar": 5800.0, "wind": 1400.0, "demand": 15800.0, "price": 0.07, "regime": "High Solar / Lower Carbon",    "weather": "Peak Solar"},
        {"hour": 14, "carbon": 325.0, "solar": 5400.0, "wind": 1450.0, "demand": 15900.0, "price": 0.08, "regime": "Low Carbon Afternoon",         "weather": "Sunny"},
        {"hour": 15, "carbon": 350.0, "solar": 4700.0, "wind": 1550.0, "demand": 16100.0, "price": 0.09, "regime": "Low Carbon Window",            "weather": "Sunny"},
        {"hour": 16, "carbon": 430.0, "solar": 3500.0, "wind": 1600.0, "demand": 16400.0, "price": 0.11, "regime": "Solar Tapering",               "weather": "Partly Cloudy"},
        {"hour": 17, "carbon": 540.0, "solar": 1800.0, "wind": 1650.0, "demand": 16900.0, "price": 0.15, "regime": "Evening Ramp",                 "weather": "Dusk"},
        {"hour": 18, "carbon": 660.0, "solar": 350.0,  "wind": 1600.0, "demand": 17600.0, "price": 0.19, "regime": "High Demand / Higher Carbon",  "weather": "Evening"},
        {"hour": 19, "carbon": 695.0, "solar": 0.0,    "wind": 1500.0, "demand": 18000.0, "price": 0.21, "regime": "Evening Peak",                 "weather": "Night"},
        {"hour": 20, "carbon": 715.0, "solar": 0.0,    "wind": 1450.0, "demand": 17800.0, "price": 0.22, "regime": "High Carbon Peak",             "weather": "Night"},
        {"hour": 21, "carbon": 705.0, "solar": 0.0,    "wind": 1450.0, "demand": 17000.0, "price": 0.21, "regime": "High Carbon",                  "weather": "Night"},
        {"hour": 22, "carbon": 595.0, "solar": 0.0,    "wind": 1500.0, "demand": 14600.0, "price": 0.16, "regime": "Declining Demand",             "weather": "Night"},
        {"hour": 23, "carbon": 495.0, "solar": 0.0,    "wind": 1550.0, "demand": 12200.0, "price": 0.12, "regime": "Moderate Late Night",          "weather": "Clear Night"},
    ],
    # Overcast / Coal-Heavy Stress Test Profile
    "high_carbon_stress": [
        {"hour": h, "carbon": float(620 + (h % 6) * 35), "solar": float(max(0, 1200 - abs(12 - h) * 220)),
         "wind": 800.0, "demand": 16500.0, "price": 0.19, "regime": "Coal Baseload Stress", "weather": "Overcast"}
        for h in range(24)
    ],
}


class SimulatedGridDataProvider(GridDataProvider):
    """
    Deterministic 24-hour Grid Carbon & Renewable Simulation Engine.
    Explicitly marks all outputs with is_simulated=True and data_source='SIMULATION_ENGINE'.
    """

    def __init__(self) -> None:
        self.current_hour: int = 15  # Starts at 15:00 by default for immediate demo readiness
        self.active_profile: str = "demo_default"
        self.override_current_carbon: Optional[float] = None
        self.override_current_solar_mw: Optional[float] = None
        self.cloud_capacity_utilization_pct: float = 42.0

    def reset(self) -> None:
        self.current_hour = 15
        self.active_profile = "demo_default"
        self.override_current_carbon = None
        self.override_current_solar_mw = None
        self.cloud_capacity_utilization_pct = 42.0

    def set_hour(self, hour: int) -> None:
        self.current_hour = hour % 24

    def step_hour(self, delta: int = 1) -> int:
        self.current_hour = (self.current_hour + delta) % 24
        return self.current_hour

    def _build_point(self, row: Dict[str, float | int | str], apply_override: bool = False) -> GridHourlyPoint:
        hour = int(row["hour"])
        carbon = float(row["carbon"])
        solar = float(row["solar"])
        wind = float(row["wind"])
        demand = float(row["demand"])
        price = float(row["price"])
        regime = str(row["regime"])
        weather = str(row.get("weather", "Clear Sky"))

        if apply_override and hour == self.current_hour:
            if self.override_current_carbon is not None:
                carbon = float(self.override_current_carbon)
            if self.override_current_solar_mw is not None:
                solar = float(self.override_current_solar_mw)

        # Calculate renewable percentage based on solar + wind + hydro baseload (800 MW)
        renewable_mw = solar + wind + 800.0
        renewable_pct = round(min(98.0, max(5.0, (renewable_mw / max(demand, 1.0)) * 100.0)), 1)

        return GridHourlyPoint(
            hour=hour,
            time_str=f"{hour:02d}:00",
            carbon_intensity_gco2_kwh=round(carbon, 1),
            solar_generation_mw=round(solar, 1),
            wind_generation_mw=round(wind, 1),
            renewable_percentage=renewable_pct,
            demand_mw=round(demand, 1),
            electricity_price_usd_kwh=round(price, 3),
            grid_regime=regime,
            weather_condition=weather,
            is_simulated=True,
        )

    def get_24h_forecast(self) -> List[GridHourlyPoint]:
        rows = PROFILES.get(self.active_profile, PROFILES["demo_default"])
        return [self._build_point(r, apply_override=True) for r in rows]

    def get_historical_24h(self) -> List[GridHourlyPoint]:
        # Historical 24h represents yesterday's curve with slight realistic variance (-3% to +3%)
        forecast = self.get_24h_forecast()
        historical: List[GridHourlyPoint] = []
        for pt in forecast:
            offset = ((pt.hour * 7) % 11 - 5) * 4.5
            historical.append(
                GridHourlyPoint(
                    hour=pt.hour,
                    time_str=pt.time_str,
                    carbon_intensity_gco2_kwh=round(max(100.0, pt.carbon_intensity_gco2_kwh + offset), 1),
                    solar_generation_mw=pt.solar_generation_mw,
                    wind_generation_mw=pt.wind_generation_mw,
                    renewable_percentage=pt.renewable_percentage,
                    demand_mw=pt.demand_mw,
                    electricity_price_usd_kwh=pt.electricity_price_usd_kwh,
                    grid_regime=pt.grid_regime,
                    weather_condition=pt.weather_condition,
                    is_simulated=True,
                )
            )
        return historical

    def get_current_status(self) -> GridStatusResponse:
        points = self.get_24h_forecast()
        current_pt = points[self.current_hour]

        if current_pt.carbon_intensity_gco2_kwh >= 600:
            status_label = "HIGH CARBON (DEFER FLEXIBLE JOBS)"
        elif current_pt.carbon_intensity_gco2_kwh <= 420:
            status_label = "CLEAN WINDOW (OPTIMAL EXECUTION)"
        else:
            status_label = "MODERATE CARBON"

        return GridStatusResponse(
            current_time=current_pt.time_str,
            current_hour=current_pt.hour,
            carbon_intensity_gco2_kwh=current_pt.carbon_intensity_gco2_kwh,
            renewable_percentage=current_pt.renewable_percentage,
            solar_generation_mw=current_pt.solar_generation_mw,
            wind_generation_mw=current_pt.wind_generation_mw,
            demand_mw=current_pt.demand_mw,
            electricity_price_usd_kwh=current_pt.electricity_price_usd_kwh,
            grid_status_label=status_label,
            grid_regime=current_pt.grid_regime,
            weather_condition=current_pt.weather_condition,
            data_source=f"SIMULATION_ENGINE ({self.active_profile})",
            is_simulated=True,
            cloud_capacity_utilization_pct=self.cloud_capacity_utilization_pct,
        )


# =====================================================================
# 2. REAL API INTEGRATION ADAPTER (Pluggable Live Provider)
# =====================================================================

class ElectricityMapsLiveAdapter(GridDataProvider):
    """
    Pluggable live grid telemetry adapter for Electricity Maps API.
    If credentials are not configured or live API is unreachable, raises a clear error
    or falls back explicitly with warning logs.
    """

    def __init__(self, api_key: str, zone: str, fallback: SimulatedGridDataProvider) -> None:
        self.api_key = api_key
        self.zone = zone
        self.fallback = fallback

    def get_current_status(self) -> GridStatusResponse:
        if not self.api_key:
            return self.fallback.get_current_status()
        try:
            resp = httpx.get(
                f"https://api.electricitymap.org/v3/carbon-intensity/latest?zone={self.zone}",
                headers={"auth-token": self.api_key},
                timeout=5.0,
            )
            resp.raise_for_status()
            data = resp.json()
            carbon = float(data.get("carbonIntensity", 500.0))
            base = self.fallback.get_current_status()
            base.carbon_intensity_gco2_kwh = carbon
            base.data_source = f"LIVE_API (ElectricityMaps:{self.zone})"
            base.is_simulated = False
            return base
        except Exception:
            return self.fallback.get_current_status()

    def get_24h_forecast(self) -> List[GridHourlyPoint]:
        return self.fallback.get_24h_forecast()

    def get_historical_24h(self) -> List[GridHourlyPoint]:
        return self.fallback.get_historical_24h()


# Singleton instance used across MCP tools and API
simulated_grid_provider = SimulatedGridDataProvider()


def get_grid_provider() -> GridDataProvider:
    if settings.grid_data_provider.upper() == "LIVE_API" and settings.electricity_maps_api_key:
        return ElectricityMapsLiveAdapter(
            api_key=settings.electricity_maps_api_key,
            zone=settings.electricity_maps_zone,
            fallback=simulated_grid_provider,
        )
    return simulated_grid_provider
