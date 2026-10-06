from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from backend.config import settings
from backend.mcp.server import mcp_registry
from backend.models.schemas import CandidateWindow, ReasoningDecisionOutput

logger = logging.getLogger(__name__)


class ReasoningAgent:
    """
    3. Optimization / Reasoning Agent (REASON Layer)
    Combines deterministic carbon-window mathematical optimization (via MCP `find_optimal_execution_window`)
    with Gemini / Antigravity explainable reasoning to produce Pydantic-validated scheduling decisions.
    """

    name: str = "ReasoningAgent"

    def reason_schedule(
        self,
        workload: Dict[str, Any],
        perception_data: Dict[str, Any],
    ) -> ReasoningDecisionOutput:
        current_status = perception_data["current_status"]
        forecast_points = perception_data["forecast"]

        job_id = str(workload["job_id"])
        workload_type = str(workload["workload_type"])
        priority = str(workload["priority"])
        duration_minutes = int(workload["duration_minutes"])
        deadline = str(workload["deadline"])
        energy_kwh = float(workload["energy_kwh"])
        current_time = str(current_status["current_time"])
        current_carbon = float(current_status["carbon_intensity_gco2_kwh"])

        # Step 1: Invoke MCP Optimization Tool for exact candidate window calculation
        opt_result = mcp_registry.call_tool(
            "find_optimal_execution_window",
            {
                "current_time": current_time,
                "current_carbon_intensity": current_carbon,
                "forecasted_carbon_intensity": forecast_points,
                "job_duration_minutes": duration_minutes,
                "job_deadline": deadline,
                "job_energy_kwh": energy_kwh,
                "job_priority": priority,
            },
        )["result"]

        recommended_action = str(opt_result["recommended_action"])
        rec_start = str(opt_result["recommended_start_time"])
        pred_carbon = float(opt_result["predicted_carbon_intensity"])
        carbon_savings_g = float(opt_result["estimated_carbon_savings_gco2"])
        cost_savings_usd = float(opt_result["estimated_cost_savings_usd"])
        carbon_red_pct = float(opt_result["carbon_reduction_pct"])

        # Step 2: Generate transparent, human-readable explanation
        explanation = self._build_deterministic_explanation(
            job_id=job_id,
            workload_type=workload_type,
            priority=priority,
            duration_minutes=duration_minutes,
            current_time=current_time,
            recommended_start_time=rec_start,
            deadline=deadline,
            current_carbon=current_carbon,
            predicted_carbon=pred_carbon,
            carbon_savings_g=carbon_savings_g,
            carbon_red_pct=carbon_red_pct,
            cost_savings_usd=cost_savings_usd,
            recommended_action=recommended_action,
            deadline_tight=bool(opt_result.get("deadline_tight", False)),
        )

        reasoning_engine_label = "Antigravity Hybrid Reasoning (Deterministic + Policy-Aware)"

        # Step 3: Optional live Gemini enrichment if GEMINI_API_KEY is configured
        if settings.gemini_api_key:
            gemini_reason = self._try_gemini_enrichment(
                workload=workload,
                current_status=current_status,
                opt_result=opt_result,
                default_explanation=explanation,
            )
            if gemini_reason:
                explanation = gemini_reason
                reasoning_engine_label = f"Google Gemini ({settings.gemini_model}) via Antigravity"

        # Calculate confidence based on forecast horizon and carbon differential
        if recommended_action == "DEFER":
            confidence = min(0.98, round(0.84 + min(0.14, (carbon_red_pct / 100.0) * 0.25), 2))
        else:
            confidence = 0.95

        candidates = [
            CandidateWindow(**w) for w in opt_result.get("candidate_windows", [])
        ]

        # Validate output strictly through Pydantic model
        decision_output = ReasoningDecisionOutput(
            job_id=job_id,
            decision=recommended_action,
            recommended_start_time=rec_start,
            reason=explanation,
            current_carbon_intensity=current_carbon,
            predicted_carbon_intensity=pred_carbon,
            estimated_carbon_savings=carbon_savings_g,
            estimated_cost_savings=cost_savings_usd,
            deadline=deadline,
            confidence=confidence,
            baseline_emissions_gco2=float(opt_result["baseline_emissions_gco2"]),
            optimized_emissions_gco2=float(opt_result["optimized_emissions_gco2"]),
            carbon_reduction_pct=carbon_red_pct,
            baseline_cost_usd=float(opt_result["baseline_cost_usd"]),
            optimized_cost_usd=float(opt_result["optimized_cost_usd"]),
            cost_reduction_pct=float(opt_result["cost_reduction_pct"]),
            reasoning_engine=reasoning_engine_label,
            candidate_windows=candidates,
        )
        return decision_output

    @staticmethod
    def _build_deterministic_explanation(
        job_id: str,
        workload_type: str,
        priority: str,
        duration_minutes: int,
        current_time: str,
        recommended_start_time: str,
        deadline: str,
        current_carbon: float,
        predicted_carbon: float,
        carbon_savings_g: float,
        carbon_red_pct: float,
        cost_savings_usd: float,
        recommended_action: str,
        deadline_tight: bool,
    ) -> str:
        carbon_kg = carbon_savings_g / 1000.0
        if recommended_action == "DEFER":
            return (
                f"Job {job_id} ({workload_type}) was deferred from {current_time} to {recommended_start_time} "
                f"because predicted carbon intensity decreases from {current_carbon:.0f} gCO2/kWh to "
                f"{predicted_carbon:.0f} gCO2/kWh (-{carbon_red_pct:.1f}%, saving {carbon_kg:.2f} kgCO2 "
                f"and ${cost_savings_usd:.2f}). The {deadline} deadline remains satisfied for this "
                f"{duration_minutes}-minute workload."
            )
        if deadline_tight:
            return (
                f"Job {job_id} ({workload_type}) scheduled to run immediately at {current_time} despite "
                f"grid carbon intensity of {current_carbon:.0f} gCO2/kWh because the {duration_minutes}-minute "
                f"execution duration would violate the {deadline} deadline if delayed."
            )
        if priority.upper() == "CRITICAL":
            return (
                f"Job {job_id} ({workload_type}) scheduled to run immediately at {current_time} because "
                f"it carries CRITICAL priority and cannot be deferred even though current carbon intensity "
                f"is {current_carbon:.0f} gCO2/kWh."
            )
        return (
            f"Job {job_id} ({workload_type}) scheduled for immediate execution at {current_time} "
            f"({current_carbon:.0f} gCO2/kWh) as the current window is already optimal before the {deadline} deadline."
        )

    @staticmethod
    def _try_gemini_enrichment(
        workload: Dict[str, Any],
        current_status: Dict[str, Any],
        opt_result: Dict[str, Any],
        default_explanation: str,
    ) -> str | None:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model)
            prompt = (
                "You are GridAgent-AI Reasoning Agent. Provide a single concise, explainable 2-sentence justification "
                "for why this cloud workload scheduling decision was made. Include exact times, gCO2/kWh numbers, "
                "and deadline compliance.\n"
                f"Workload: {json.dumps(workload)}\n"
                f"Current Grid: {json.dumps(current_status)}\n"
                f"Optimization Result: {json.dumps({k: v for k, v in opt_result.items() if k != 'candidate_windows'})}"
            )
            response = model.generate_content(prompt)
            text = (response.text or "").strip()
            return text if len(text) > 20 else default_explanation
        except Exception as exc:
            logger.warning("Gemini API fallback to deterministic reasoning: %s", exc)
            return None


reasoning_agent = ReasoningAgent()
