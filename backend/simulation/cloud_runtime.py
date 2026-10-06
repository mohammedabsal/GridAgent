from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from backend.database import db_manager
from backend.models.schemas import WorkloadJob, WorkloadStatus


class CloudRuntimeAdapter(ABC):
    """
    Clean abstraction for workload execution so the prototype's simulated environment
    can be replaced by Kubernetes API, AWS Batch SDK, or GCP Cloud Run Jobs SDK.
    """

    @abstractmethod
    def submit_job(self, job: WorkloadJob) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def start_job(self, job_id: str, start_time: str) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def pause_job(self, job_id: str) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def resume_job(self, job_id: str, current_time: str) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def defer_job(self, job_id: str, recommended_start_time: str) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def cancel_job(self, job_id: str) -> WorkloadJob:
        raise NotImplementedError

    @abstractmethod
    def complete_job(self, job_id: str, completed_time: str) -> WorkloadJob:
        raise NotImplementedError


class SimulatedKubernetesAdapter(CloudRuntimeAdapter):
    """
    Simulated Kubernetes / Cloud Batch Runtime Environment.
    Safe for local demonstration: never performs destructive operations on real infrastructure.
    """

    def __init__(self) -> None:
        self._jobs: Dict[str, WorkloadJob] = {}
        self._load_from_db()

    def _load_from_db(self) -> None:
        rows = db_manager.load_all_workloads()
        for r in rows:
            try:
                job = WorkloadJob(**r)
                self._jobs[job.job_id] = job
            except Exception:
                continue

    def _persist(self, job: WorkloadJob) -> WorkloadJob:
        self._jobs[job.job_id] = job
        db_manager.save_workload(job.job_id, job.model_dump())
        return job

    def list_jobs(self) -> List[WorkloadJob]:
        return list(self._jobs.values())

    def get_job(self, job_id: str) -> Optional[WorkloadJob]:
        return self._jobs.get(job_id)

    def clear_all(self) -> None:
        self._jobs.clear()
        db_manager.clear_workloads()

    def submit_job(self, job: WorkloadJob) -> WorkloadJob:
        return self._persist(job)

    def start_job(self, job_id: str, start_time: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.RUNNING
        job.actual_start_time = start_time
        return self._persist(job)

    def pause_job(self, job_id: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.PAUSED
        return self._persist(job)

    def resume_job(self, job_id: str, current_time: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.RUNNING
        if not job.actual_start_time:
            job.actual_start_time = current_time
        return self._persist(job)

    def defer_job(self, job_id: str, recommended_start_time: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.DEFERRED
        job.recommended_start_time = recommended_start_time
        return self._persist(job)

    def mark_blocked(self, job_id: str, policy_reason: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.BLOCKED
        job.policy_reason = policy_reason
        return self._persist(job)

    def mark_awaiting_approval(self, job_id: str, recommended_start_time: str, policy_reason: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.AWAITING_APPROVAL
        job.recommended_start_time = recommended_start_time
        job.policy_reason = policy_reason
        return self._persist(job)

    def cancel_job(self, job_id: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.CANCELLED
        return self._persist(job)

    def complete_job(self, job_id: str, completed_time: str) -> WorkloadJob:
        job = self._require_job(job_id)
        job.status = WorkloadStatus.COMPLETED
        job.completed_at_time = completed_time
        return self._persist(job)

    def advance_clock_transitions(self, current_hour: int) -> List[Dict[str, str]]:
        """
        Evaluates all DEFERRED and RUNNING jobs when the simulation clock moves to `current_hour`.
        - DEFERRED jobs whose recommended_start_time matches or precedes current_hour -> RUNNING
        - RUNNING jobs whose start_hour + duration_hours <= current_hour -> COMPLETED
        """
        current_time_str = f"{current_hour:02d}:00"
        transitions: List[Dict[str, str]] = []

        for job in list(self._jobs.values()):
            # 1. Check if DEFERRED job should start now
            if job.status == WorkloadStatus.DEFERRED and job.recommended_start_time:
                rec_hour = int(job.recommended_start_time.split(":")[0])
                if current_hour == rec_hour:
                    job.status = WorkloadStatus.RUNNING
                    job.actual_start_time = current_time_str
                    self._persist(job)
                    transitions.append(
                        {
                            "job_id": job.job_id,
                            "from": "DEFERRED",
                            "to": "RUNNING",
                            "time": current_time_str,
                            "message": f"Scheduled clean window reached ({current_time_str}). Pod started on Simulated K8s cluster.",
                        }
                    )

            # 2. Check if RUNNING job has completed its duration
            elif job.status == WorkloadStatus.RUNNING and job.actual_start_time:
                start_hour = int(job.actual_start_time.split(":")[0])
                duration_hours = max(1, (job.duration_minutes + 59) // 60)
                end_hour = (start_hour + duration_hours) % 24
                if current_hour == end_hour or (
                    current_hour > start_hour and (current_hour - start_hour) >= duration_hours
                ):
                    job.status = WorkloadStatus.COMPLETED
                    job.completed_at_time = current_time_str
                    self._persist(job)
                    transitions.append(
                        {
                            "job_id": job.job_id,
                            "from": "RUNNING",
                            "to": "COMPLETED",
                            "time": current_time_str,
                            "message": f"Workload {job.job_id} finished execution ({job.duration_minutes}m) at {current_time_str}.",
                        }
                    )

        return transitions

    def _require_job(self, job_id: str) -> WorkloadJob:
        if job_id not in self._jobs:
            raise KeyError(f"Workload job '{job_id}' not found in cloud runtime.")
        return self._jobs[job_id]


# Singleton simulated Kubernetes runtime
cloud_runtime = SimulatedKubernetesAdapter()
