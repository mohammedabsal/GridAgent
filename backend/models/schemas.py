from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class WorkloadStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    DEFERRED = "DEFERRED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    CANCELLED = "CANCELLED"


class WorkloadPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DecisionType(str, Enum):
    RUN_IMMEDIATELY = "RUN_IMMEDIATELY"
    DEFER = "DEFER"
    BLOCKED_BY_SAFETY = "BLOCKED_BY_SAFETY"
    ASK_USER = "ASK_USER"


class PolicyDecisionType(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    ASK_USER = "ASK_USER"


class AgentStage(str, Enum):
    PERCEIVE = "PERCEIVE"
    WORKLOAD = "WORKLOAD"
    REASON = "REASON"
    SAFETY = "SAFETY"
    EXECUTE = "EXECUTE"


class GridHourlyPoint(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    time_str: str = Field(..., description="Formatted time HH:00")
    carbon_intensity_gco2_kwh: float = Field(..., ge=0.0, description="Carbon intensity in gCO2/kWh")
    solar_generation_mw: float = Field(..., ge=0.0, description="Solar generation in MW")
    wind_generation_mw: float = Field(..., ge=0.0, description="Wind generation in MW")
    renewable_percentage: float = Field(..., ge=0.0, le=100.0, description="Renewable share percentage")
    demand_mw: float = Field(..., ge=0.0, description="Total grid electricity demand in MW")
    electricity_price_usd_kwh: float = Field(..., ge=0.0, description="Dynamic tariff price in USD/kWh")
    grid_regime: str = Field(..., description="Human-readable condition label")
    weather_condition: str = Field(default="Clear Sky", description="Simulated weather condition")
    is_simulated: bool = Field(default=True, description="True when produced by simulation engine")


class GridStatusResponse(BaseModel):
    current_time: str
    current_hour: int
    carbon_intensity_gco2_kwh: float
    renewable_percentage: float
    solar_generation_mw: float
    wind_generation_mw: float
    demand_mw: float
    electricity_price_usd_kwh: float
    grid_status_label: str
    grid_regime: str
    weather_condition: str
    data_source: str = "SIMULATION_ENGINE"
    is_simulated: bool = True
    cloud_capacity_utilization_pct: float = 42.0


class CandidateWindow(BaseModel):
    start_hour: int
    start_time: str
    end_hour: int
    end_time: str
    avg_carbon_intensity: float
    avg_solar_mw: float
    avg_renewable_pct: float
    avg_price_usd_kwh: float
    estimated_emissions_gco2: float
    estimated_cost_usd: float
    Composite_score: float = Field(default=0.0, alias="composite_score")
    meets_deadline: bool = True

    model_config = {"populate_by_name": True}


class ReasoningDecisionOutput(BaseModel):
    """Structured explainable output from the Reasoning Agent (validated via Pydantic)."""

    job_id: str = Field(..., description="Unique identifier of the workload job")
    decision: str = Field(
        ...,
        description="Scheduling decision: RUN_IMMEDIATELY, DEFER, BLOCKED_BY_SAFETY, or ASK_USER",
    )
    recommended_start_time: str = Field(..., description="Recommended execution start time (HH:00)")
    reason: str = Field(..., description="Human-readable explanation for why the decision was made")
    current_carbon_intensity: float = Field(..., ge=0.0, description="Current grid carbon intensity (gCO2/kWh)")
    predicted_carbon_intensity: float = Field(
        ..., ge=0.0, description="Predicted carbon intensity in recommended window (gCO2/kWh)"
    )
    estimated_carbon_savings: float = Field(
        ..., description="Estimated carbon savings in gCO2 compared to immediate execution"
    )
    estimated_cost_savings: float = Field(
        ..., description="Estimated electricity/cloud cost savings in USD"
    )
    deadline: str = Field(..., description="Workload deadline (HH:00)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Agent confidence score [0.0, 1.0]")

    # Extended analytical fields for transparency and comparison
    baseline_emissions_gco2: float = Field(default=0.0, description="Immediate execution emissions (gCO2)")
    optimized_emissions_gco2: float = Field(default=0.0, description="Optimized window emissions (gCO2)")
    carbon_reduction_pct: float = Field(default=0.0, description="Percentage carbon reduction")
    baseline_cost_usd: float = Field(default=0.0, description="Immediate execution cost (USD)")
    optimized_cost_usd: float = Field(default=0.0, description="Optimized window cost (USD)")
    cost_reduction_pct: float = Field(default=0.0, description="Percentage cost reduction")
    reasoning_engine: str = Field(
        default="GridAgent Hybrid Reasoning (Deterministic + Gemini/Antigravity)",
        description="Engine that generated the decision",
    )
    candidate_windows: List[CandidateWindow] = Field(default_factory=list)

    @field_validator("confidence")
    @classmethod
    def clamp_confidence(cls, v: float) -> float:
        return round(max(0.0, min(1.0, v)), 3)


class PolicyValidationResult(BaseModel):
    job_id: str
    workload_type: str
    proposed_decision: str
    policy_decision: PolicyDecisionType
    rule_matched: str
    reason: str
    can_proceed_automatically: bool
    requires_human_approval: bool
    is_blocked: bool
    timestamp: str


class WorkloadJob(BaseModel):
    job_id: str
    name: str
    workload_type: str
    priority: WorkloadPriority
    duration_minutes: int = Field(..., gt=0)
    deadline: str
    energy_kwh: float = Field(..., gt=0.0)
    estimated_cloud_cost_usd: float = Field(default=0.0)
    submitted_at_time: str
    status: WorkloadStatus
    recommended_start_time: Optional[str] = None
    actual_start_time: Optional[str] = None
    completed_at_time: Optional[str] = None
    current_carbon_intensity: Optional[float] = None
    predicted_carbon_intensity: Optional[float] = None
    baseline_emissions_gco2: float = 0.0
    optimized_emissions_gco2: float = 0.0
    estimated_carbon_savings_gco2: float = 0.0
    carbon_reduction_pct: float = 0.0
    baseline_cost_usd: float = 0.0
    optimized_cost_usd: float = 0.0
    estimated_cost_savings_usd: float = 0.0
    cost_reduction_pct: float = 0.0
    decision: Optional[str] = None
    decision_reason: Optional[str] = None
    policy_decision: Optional[str] = None
    policy_reason: Optional[str] = None
    confidence: Optional[float] = None
    region: str = "ap-south-1 (Simulated K8s)"
    is_protected_service: bool = False


class WorkloadSubmitRequest(BaseModel):
    job_id: Optional[str] = None
    name: str = Field(..., min_length=2)
    workload_type: str = Field(default="ai_model_training")
    priority: WorkloadPriority = Field(default=WorkloadPriority.MEDIUM)
    duration_minutes: int = Field(default=60, ge=15, le=720)
    deadline: str = Field(default="20:00", pattern=r"^\d{2}:\d{2}$")
    energy_kwh: float = Field(default=150.0, gt=0.0)
    estimated_cloud_cost_usd: Optional[float] = None
    auto_orchestrate: bool = Field(default=True)


class AgentActivityEvent(BaseModel):
    id: str
    timestamp: str
    simulation_time: str
    stage: AgentStage
    agent_name: str
    job_id: Optional[str] = None
    title: str
    message: str
    level: str = "INFO"  # INFO, SUCCESS, WARNING, ERROR
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimulationUpdateRequest(BaseModel):
    current_hour: Optional[int] = Field(default=None, ge=0, le=23)
    profile: Optional[str] = None
    override_current_carbon: Optional[float] = Field(default=None, ge=20.0, le=1200.0)
    override_current_solar_mw: Optional[float] = Field(default=None, ge=0.0, le=10000.0)
    cloud_capacity_utilization_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class ComparisonMetrics(BaseModel):
    total_jobs_evaluated: int
    optimized_jobs_count: int
    blocked_jobs_count: int
    awaiting_approval_count: int
    baseline_total_emissions_gco2: float
    optimized_total_emissions_gco2: float
    total_carbon_saved_gco2: float
    carbon_reduction_percentage: float
    baseline_total_cost_usd: float
    optimized_total_cost_usd: float
    total_cost_saved_usd: float
    cost_reduction_percentage: float
    job_comparisons: List[Dict[str, Any]]
