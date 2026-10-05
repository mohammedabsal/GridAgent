# GridAgent-AI

**Autonomous Multi-Agent Cloud Platform for Dynamic Grid Carbon Intensity & Enterprise Workload Orchestration**

> **Note:** In this project, **Antigravity** refers to the **Google Antigravity SDK / agent orchestration environment**, not physical antigravity technology.

---

## 1. Overview & Core Problem

Enterprise cloud workloads—such as **AI model training**, **batch analytics**, **database indexing**, **video rendering**, and **large data processing**—consume substantial electricity and are traditionally executed on static FIFO schedules regardless of electricity grid carbon intensity.

**GridAgent-AI** implements a modular **`PERCEIVE → REASON → SAFETY CHECK → EXECUTE`** multi-agent architecture connected via **Model Context Protocol (MCP)** tools to dynamically defer flexible workloads into cleaner, renewable-rich grid windows while strictly enforcing SLA deadlines and enterprise governance guardrails.

---

## 2. Project Structure

```text
gridagent-ai/
├── backend/
│   ├── agents/
│   │   ├── perception_agent.py     # 1. Grid Perception Agent (PERCEIVE)
│   │   ├── workload_agent.py       # 2. Workload Queue & Constraint Agent (PERCEIVE)
│   │   ├── reasoning_agent.py      # 3. Optimization & Gemini Reasoning Agent (REASON)
│   │   ├── safety_agent.py         # 4. Governance Policy Validation Agent (SAFETY CHECK)
│   │   ├── execution_agent.py      # 5. Cloud Runtime Execution Agent (EXECUTE)
│   │   └── orchestrator.py         # End-to-end multi-agent pipeline coordinator
│   ├── mcp/
│   │   ├── grid_tools.py           # MCP tools: get_current_grid_status, get_grid_forecast, get_solar_forecast
│   │   ├── workload_tools.py       # MCP tools: get_workload_queue, get_workload_details, submit/start/pause/defer
│   │   ├── optimization_tools.py   # MCP tool: find_optimal_execution_window
│   │   ├── safety_tools.py         # MCP tool: check_execution_policy
│   │   └── server.py               # Unified MCP Tool Registry & dispatcher
│   ├── models/
│   │   ├── schemas.py              # Pydantic models (ReasoningDecisionOutput, WorkloadJob, etc.)
│   │   └── db_models.py            # SQLite persistence models
│   ├── simulation/
│   │   ├── grid_simulator.py       # 24-hour Grid Simulation Engine + Live API Adapter
│   │   ├── cloud_runtime.py        # Simulated Kubernetes Runtime Adapter (CloudRuntimeAdapter ABC)
│   │   └── demo_scenarios.py       # 5 canonical demo scenarios & Judge Lifecycle Walkthrough
│   ├── policies/
│   │   └── policy_engine.py        # Governance Policy Engine (ALLOW / DENY / ASK_USER)
│   ├── api/
│   │   └── routes.py               # FastAPI REST endpoints
│   ├── config.py                   # Environment configuration
│   ├── database.py                 # SQLite database manager
│   └── main.py                     # FastAPI application entrypoint
├── frontend/
│   ├── components/
│   │   ├── TopMetricsBar.tsx       # Top KPI bar, simulation clock, profile switcher
│   │   ├── CarbonForecastChart.tsx # 24-hour carbon intensity & renewable forecast chart
│   │   ├── WorkloadTable.tsx       # Workload queue, explainability drawer, operator actions
│   │   ├── AgentActivityFeed.tsx   # Live PERCEIVE -> REASON -> SAFETY -> EXECUTE stream
│   │   ├── BeforeAfterComparison.tsx # Traditional Scheduler vs GridAgent-AI comparison
│   │   ├── SafetyAndMcpPanel.tsx   # Governance policy matrix, SQLite audit log & MCP Inspector
│   │   └── SubmitWorkloadModal.tsx # Custom workload submission & telemetry override modal
│   ├── pages/
│   │   └── Dashboard.tsx           # Main orchestrator dashboard page
│   ├── services/
│   │   └── api.ts                  # Typed REST client
│   ├── App.tsx
│   ├── main.tsx
│   └── package.json
├── tests/
│   ├── test_optimization.py        # Unit tests for carbon-aware optimization algorithm
│   ├── test_policy_engine.py       # Unit tests for ALLOW / DENY / ASK_USER safety policies
│   ├── test_agents_and_mcp.py      # Unit tests for agents, Pydantic validation, and MCP tools
│   └── test_api_scenarios.py       # End-to-end API & 5 Demo Scenarios + Judge Walkthrough tests
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/
│   └── ARCHITECTURE.md
├── .env.example
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 3. Quickstart & Local Setup Instructions

### Prerequisites
- **Python 3.10+** (tested with Python 3.12)
- **Node.js 18+** & **npm**

### Step 1: Environment Variables
Copy `.env.example` to `.env` (optional—sensible defaults are built-in for local simulation):
```powershell
Copy-Item .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `GRID_DATA_PROVIDER` | `SIMULATION` | `SIMULATION` (24h engine) or `LIVE_API` (Electricity Maps) |
| `CLOUD_RUNTIME_PROVIDER` | `SIMULATED_K8S` | Simulated Kubernetes execution environment |
| `DATABASE_URL` | `sqlite:///./gridagent.db` | Local SQLite database path |
| `GEMINI_API_KEY` | *(empty)* | Optional Google Gemini API key for live LLM explanation enrichment |
| `SAFETY_COST_LIMIT_USD` | `500.0` | Cost threshold above which `ASK_USER` human approval is triggered |
| `SAFETY_ENERGY_LIMIT_KWH` | `500.0` | Energy threshold above which `ASK_USER` human approval is triggered |

### Step 2: Install & Start Backend (FastAPI on port 8000)
```powershell
py -3.12 -m pip install -r requirements.txt
py -3.12 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Dashboard State API: `http://127.0.0.1:8000/api/dashboard`

### Step 3: Install & Start Frontend (Vite + React on port 5173)
```powershell
cd frontend
npm install
npm run dev
```
- Open **`http://localhost:5173`** in your browser.

### Step 4: Run Automated Tests
```powershell
py -3.12 -m pytest -v
```

---

## 4. Demonstration Walkthrough (Judge Experience)

1. **Initial State (`15:00`)**:
   - Current grid carbon intensity at `15:00` is **700 gCO₂/kWh** (High Carbon / Peaker Spike).
   - Forecast shows carbon intensity dropping to **450 gCO₂/kWh** at `16:00`, **390 gCO₂/kWh** at `17:00` (Clean Window), **420 gCO₂/kWh** at `18:00`, and rising to **650 gCO₂/kWh** at `19:00`.
2. **Run Scenario 1 (`AI-TRAINING-001`)**:
   - Duration: `60 minutes`, Deadline: `20:00`, Energy: `150 kWh`.
   - **`[PERCEIVE]`** retrieves the 24-hour forecast and workload constraints.
   - **`[REASON]`** evaluates candidate windows `[15:00..20:00]` and recommends **Deferring until `17:00`** (`390 gCO₂/kWh`), saving **46.50 kgCO₂ (-44.29%)** and **$19.50 (-59.09%)** while meeting the `20:00` deadline.
   - **`[SAFETY]`** validates `ai_model_training` → **`ALLOW`**.
   - **`[EXECUTE]`** transitions `AI-TRAINING-001` from **`QUEUED → DEFERRED`**.
3. **Advance Simulation Clock (`15:00 → 17:00 → 18:00`)**:
   - Click **`+1h Step`** twice (or click **`Judge Walkthrough (15:00→18:00)`** in the header):
   - At **`17:00`**, `ExecutionAgent` automatically transitions `AI-TRAINING-001` from **`DEFERRED → RUNNING`**.
   - At **`18:00`**, `ExecutionAgent` transitions `AI-TRAINING-001` from **`RUNNING → COMPLETED`**.
4. **Explore All 5 Scenarios**:
   - **Scenario 1**: Flexible AI Training (`AI-TRAINING-001`) → `DEFER` to `17:00` (`ALLOW`)
   - **Scenario 2**: Urgent Production Workload (`URGENT-ANALYTICS-002`, Deadline `16:00`) → `RUN_IMMEDIATELY` at `15:00` (`ALLOW`)
   - **Scenario 3**: Protected Production Service (`PROD-WEB-003`, `production_web_server`) → `BLOCKED_BY_SAFETY` (`DENY`)
   - **Scenario 4**: Multi-Window Batch Analytics (`BATCH-ETL-004`, 120 mins, Deadline `22:00`) → Chooses lowest-carbon 2-hour window `17:00–19:00` (`405 gCO₂/kWh` avg)
   - **Scenario 5**: High-Cost Cloud Migration (`MIGRATION-005`, `$680`, `650 kWh`) → `AWAITING_APPROVAL` (`ASK_USER`), allowing operator click-to-Approve or Reject in the UI.
