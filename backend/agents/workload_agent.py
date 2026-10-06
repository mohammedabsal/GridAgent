from __future__ import annotations

from typing import Any, Dict, List
from backend.mcp.server import mcp_registry


class WorkloadAgent:
    """
    2. Workload Agent (PERCEIVE Layer)
    Inspects queued cloud workloads, execution durations, energy requirements, priorities, and SLA deadlines.
    """

    name: str = "WorkloadAgent"

    def get_queue_snapshot(self) -> Dict[str, Any]:
        return mcp_registry.call_tool("get_workload_queue")["result"]

    def inspect_job(self, job_id: str) -> Dict[str, Any]:
        res = mcp_registry.call_tool("get_workload_details", {"job_id": job_id})["result"]
        if not res.get("found"):
            raise KeyError(f"Workload '{job_id}' not found in queue.")
        workload = res["workload"]

        # Enrich with constraint analysis
        duration_hrs = round(float(workload["duration_minutes"]) / 60.0, 2)
        return {
            "workload": workload,
            "constraint_summary": (
                f"Job '{workload['job_id']}' ({workload['workload_type']}) | "
                f"Priority: {workload['priority']} | Duration: {workload['duration_minutes']}m ({duration_hrs}h) | "
                f"Deadline: {workload['deadline']} | Energy: {workload['energy_kwh']} kWh"
            ),
        }

    def list_queued_jobs(self) -> List[Dict[str, Any]]:
        queue = self.get_queue_snapshot()
        return [w for w in queue["workloads"] if w["status"] == "QUEUED"]


workload_agent = WorkloadAgent()
