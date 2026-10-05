from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List
from backend.config import settings


def get_sqlite_path() -> str:
    url = settings.database_url
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "", 1)
    return "gridagent.db"


class DatabaseManager:
    """Lightweight SQLite persistence layer for workloads, agent logs, and policy audit trail."""

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or get_sqlite_path()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS workloads (
                    job_id TEXT PRIMARY KEY,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS agent_events (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    simulation_time TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    job_id TEXT,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    level TEXT NOT NULL,
                    metadata_json TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS policy_audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    workload_type TEXT NOT NULL,
                    proposed_decision TEXT NOT NULL,
                    policy_decision TEXT NOT NULL,
                    rule_matched TEXT NOT NULL,
                    reason TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def save_workload(self, job_id: str, data: Dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO workloads (job_id, payload_json, updated_at)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(job_id) DO UPDATE SET
                    payload_json = excluded.payload_json,
                    updated_at = datetime('now')
                """,
                (job_id, json.dumps(data)),
            )
            conn.commit()

    def load_all_workloads(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT payload_json FROM workloads ORDER BY updated_at ASC").fetchall()
            return [json.loads(r["payload_json"]) for r in rows]

    def clear_workloads(self) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM workloads")
            conn.commit()

    def save_agent_event(self, event: Dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO agent_events
                (id, timestamp, simulation_time, stage, agent_name, job_id, title, message, level, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event["id"],
                    event["timestamp"],
                    event["simulation_time"],
                    event["stage"],
                    event["agent_name"],
                    event.get("job_id"),
                    event["title"],
                    event["message"],
                    event.get("level", "INFO"),
                    json.dumps(event.get("metadata", {})),
                ),
            )
            conn.commit()

    def load_agent_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM agent_events ORDER BY rowid DESC LIMIT ?", (limit,)
            ).fetchall()
            result = []
            for r in reversed(rows):
                result.append(
                    {
                        "id": r["id"],
                        "timestamp": r["timestamp"],
                        "simulation_time": r["simulation_time"],
                        "stage": r["stage"],
                        "agent_name": r["agent_name"],
                        "job_id": r["job_id"],
                        "title": r["title"],
                        "message": r["message"],
                        "level": r["level"],
                        "metadata": json.loads(r["metadata_json"]),
                    }
                )
            return result

    def clear_agent_events(self) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM agent_events")
            conn.commit()

    def log_policy_audit(self, entry: Dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO policy_audit_logs
                (timestamp, job_id, workload_type, proposed_decision, policy_decision, rule_matched, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    entry["timestamp"],
                    entry["job_id"],
                    entry["workload_type"],
                    entry["proposed_decision"],
                    entry["policy_decision"],
                    entry["rule_matched"],
                    entry["reason"],
                ),
            )
            conn.commit()

    def get_policy_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM policy_audit_logs ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def clear_policy_audit_logs(self) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM policy_audit_logs")
            conn.commit()


db_manager = DatabaseManager()
