# Project Structure

This document outlines the directory structure of the GridAgent project to help developers understand where different parts of the application reside.

## Overview

```text
.
├── backend/                  # Python backend application
│   ├── agents/               # AI Agents (execution, orchestrator, perception, reasoning, safety, workload)
│   ├── api/                  # API routes and initialization
│   ├── mcp/                  # Model Context Protocol tools and server configuration
│   ├── models/               # Database and API schemas/models
│   ├── policies/             # Policy engine for grid management
│   └── simulation/           # Grid simulation and runtime logic
├── docker/                   # Docker configuration files
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                     # Project documentation
│   └── ARCHITECTURE.md
├── frontend/                 # React frontend application (Vite + TailwindCSS)
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page layouts (e.g., Dashboard)
│   └── services/             # API integration services
├── tests/                    # Backend tests
└── root files                # Configuration (.env, .gitignore, README.md, docker-compose.yml, requirements.txt)
```

## Detailed Component Breakdown

### Backend (`/backend`)
The backend is built with Python and contains several modular components:
- **`agents/`**: Contains various AI agents responsible for different tasks (e.g., perception, reasoning, execution, safety).
- **`api/`**: The web server layer handling incoming HTTP requests.
- **`mcp/`**: Contains the tools needed for the Model Context Protocol, enabling agents to interact with the system securely.
- **`models/`**: Defines data structures, database schemas (`db_models.py`), and Pydantic validation schemas (`schemas.py`).
- **`policies/`**: Rules and logic for grid operations (`policy_engine.py`).
- **`simulation/`**: Code for simulating cloud runtime and grid scenarios for testing and demonstration.

### Frontend (`/frontend`)
The frontend is a modern React application built using Vite, TypeScript, and TailwindCSS:
- **`components/`**: Modular UI elements like `AgentActivityFeed.tsx`, `CarbonForecastChart.tsx`, and `WorkloadTable.tsx`.
- **`pages/`**: High-level page structures like `Dashboard.tsx`.
- **`services/`**: Code to communicate with the backend API (`api.ts`).
- Configuration files for Tailwind (`tailwind.config.js`), PostCSS (`postcss.config.js`), and Vite (`vite.config.ts`).

### Docker (`/docker` & `docker-compose.yml`)
The project includes containerization for both the frontend and backend.
- `docker-compose.yml` orchestrates the services.
- `Dockerfile.frontend` and `Dockerfile.backend` build the respective container images.
- `nginx.conf` configures the web server for the frontend.

### Tests (`/tests`)
Contains unit and integration tests for various backend components, including the API, agents, optimization logic, and policy engine.
