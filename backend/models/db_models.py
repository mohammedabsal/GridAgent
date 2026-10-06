from __future__ import annotations

# Re-export database manager for convenience
from backend.database import DatabaseManager, db_manager

__all__ = ["DatabaseManager", "db_manager"]
