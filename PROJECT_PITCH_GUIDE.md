# GridAgent-AI — Judge Pitch & Project Guide

---

## 1. The 15-Second Elevator Pitch

> *"Cloud workloads like AI training and batch analytics consume massive electricity, but they run on blind schedules—even when the power grid is burning coal and gas. **GridAgent-AI** builds a live **Digital Twin** of your cloud infrastructure and the electricity grid, simulates future execution windows, verifies safety and SLA constraints, and automatically shifts flexible workloads to the cleanest energy window—cutting carbon by **44%** without missing a single deadline."*

---

## 2. The Core Problem

1. **Cloud computing is carbon-blind**: AI training, video rendering, and nightly analytics jobs start as soon as they are queued (e.g., `15:00`), regardless of how dirty or expensive the electricity grid is.
2. **Grid carbon changes every hour**: At `15:00`, grid carbon might be **700 gCO₂/kWh** (high fossil load). Just two hours later at `17:00`, solar/wind surges and carbon drops to **390 gCO₂/kWh**.
3. **Engineers cannot manually babysit schedules**: Teams worry about breaking SLA deadlines or delaying critical production services.

---

## 3. Our Innovation: What GridAgent-AI Does

Instead of reactive dashboards that only report emissions *after* the fact, **GridAgent-AI simulates the future before executing a workload**:

```text
OBSERVE  ──►  SIMULATE  ──►  CHECK  ──►  DECIDE & EXECUTE
```

1. **OBSERVE (`Perception + Workload Agents`)**: Reads live grid carbon intensity (`gCO₂/kWh`), solar/wind generation (`MW`), electricity price (`$/kWh`), and workload SLA deadlines via standardized **MCP (Model Context Protocol)** tools.
2. **SIMULATE (`Digital Twin Engine`)**: Models how the workload would behave across every feasible time window (`15:00`, `16:00`, `17:00`, `18:00`, `19:00`) before its deadline.
3. **CHECK (`Execution Governance Engine`)**: Enforces deterministic safety guardrails (`ALLOWED`, `ASK USER`, `BLOCKED`) so the AI **never** delays critical production traffic or violates an SLA.
4. **DECIDE (`Reasoning + Execution Agents`)**: Selects the lowest-carbon safe window (`17:00`) and automatically defers or executes the job.

---

## 4. Technical Architecture (For Technical Judges)

| Layer | Technology | Role in Prototype |
| :--- | :--- | :--- |
| **Digital Twin Frontend** | React + TypeScript + Tailwind | Interactive CAD/SCADA topology (`Solar → Grid → Data Center → Workload`) + 24h time scrubber + What-If simulator |
| **Multi-Agent Orchestrator** | Python + Gemini (`google-generativeai`) + Pydantic | 5 specialized agents (`Perception`, `Workload`, `Reasoning`, `Safety`, `Execution`) with strict Pydantic schema validation |
| **MCP Data & Tool Layer** | 16 Model Context Protocol Tools | Clean separation between simulated telemetry and plug-and-play real APIs (Electricity Maps, WattTime, Kubernetes) |
| **Safety & Governance** | Deterministic Policy Engine + SQLite Audit Log | Hard rules (`ALLOW` / `ASK_USER` / `DENY`) that override AI decisions when safety or cost thresholds are triggered |

---

## 5. 90-Second Live Demo Script for Judges

Follow this exact flow during your presentation:

### Step 1 — Show the Problem (`0:00 – 0:20`)
- Point to the **KPI Strip** and **Digital Twin Canvas** at `15:00`.
- **Say**: *"Right now it’s 15:00. An AI Model Training job (`150 kWh`, deadline `20:00`) is ready to run. But grid carbon is peaking at **700 gCO₂/kWh** with only **18.8% renewable energy**."*

### Step 2 — Run the Live Simulation (`0:20 – 0:50`)
- Click **`▶ RUN LIVE DEMO`** (or **`▶ RUN SIMULATION`**) in the top bar.
- Watch the Digital Twin step through `15:00 → 16:00 → 17:00 → 18:00` and lock onto **`17:00`**.
- **Say**: *"Instead of running blindly at 15:00, GridAgent-AI uses its Digital Twin to simulate future execution windows before the 20:00 deadline. It discovers that at **17:00**, solar generation peaks and grid carbon drops from **700 to 390 gCO₂/kWh**."*

### Step 3 — Show the "What-If" Impact & Engineering Decision (`0:50 – 1:10`)
- Point to **`WHAT HAPPENS IF WE RUN THIS WORKLOAD?`** and **`GRIDAGENT DECISION`**.
- **Say**: *"Comparing Run Now (`15:00`) vs Wait (`17:00`): we cut carbon emissions from **105.0 kg to 58.5 kg CO₂ (-44.3%)** and reduce energy cost by **59.1%**. Same workload, same deadline, cleaner energy."*

### Step 4 — Prove Safety Governance (`1:10 – 1:30`)
- Scroll to **`EXECUTION GOVERNANCE & CLOUD WORKLOADS`** and click through the workloads:
  1. **`LLM Fine-Tuning`** → `✓ ALLOWED` (Flexible batch job — auto-scheduled to `17:00`).
  2. **`Production Payment API`** → `✕ BLOCKED` (Protected service — policy engine forbids delay, runs immediately).
  3. **`Cloud Database Migration`** → `? ASK USER` (High-cost workload — held for one-click human approval).
- *Optional*: Click **`Technical View`** in the top-right to flash the live **Agent Trace**, **16 MCP Tools**, and **Policy Audit Log**.

---

## 6. Top 5 Judge Questions & Crisp Answers

1. **"Is this using real grid data or simulation?"**
   - *"For repeatable benchmarking and time-scrubbing, the prototype runs a deterministic 24-hour physics-based grid simulator clearly labeled `SIMULATED`. All data is accessed through 16 standardized **MCP tools**, so swapping in live Electricity Maps or WattTime APIs requires zero changes to the agent logic."*

2. **"What if the AI hallucinates and delays a critical production server?"**
   - *"It can't. Every AI recommendation must pass through a deterministic **Policy Governance Engine** (`ALLOW / ASK_USER / DENY`). Protected services like production APIs are hard-coded as `DENY`—the execution layer blocks deferral regardless of what the LLM suggests."*

3. **"What if a job’s deadline is too close to wait?"**
   - *"The candidate window simulator filters out any window where `start_time + duration > deadline`. If no cleaner window fits before the SLA deadline (like our `Urgent Fraud Analytics` scenario), the system runs the job immediately."*

4. **"Doesn't running an AI agent consume energy too?"**
   - *"A single scheduling evaluation takes less than 0.001 kWh, whereas deferring one 150 kWh AI training run saves **46.5 kg of CO₂**—orders of magnitude greater than the inference cost."*

5. **"Why is this a Digital Twin and not just a cron scheduler?"**
   - *"A cron job is static. GridAgent-AI models the coupled state of **grid carbon + renewable forecast + data center load + job SLA** across time, allowing operators to scrub through future hours and run counter-factual 'What-If' simulations before committing compute resources."*

