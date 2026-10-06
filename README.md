# GridAgent-AI

**Digital Twin Control Center for Carbon-Aware Cloud Computing**
*(Autonomous Multi-Agent Cloud Platform for Dynamic Grid Carbon Intensity & Enterprise Workload Orchestration)*

> **Note:** In this project, **Antigravity** refers to the **Google Antigravity SDK / agent orchestration environment**, not physical antigravity technology.

---

## 1. Core Story & Product Concept

1. **Cloud workloads need electricity.**
2. **Electricity has different carbon intensity at different times of day** (depending on solar generation, wind supply, and grid demand).
3. **GridAgent-AI creates a live Digital Twin** of your cloud data center and the 24-hour energy grid around it, simulates candidate execution windows, verifies safety guardrails, and **automatically chooses the cleanest safe time to run each workload**.

---deve

## 2. Redesigned Experience & Information Hierarchy

The frontend (`frontend/pages/Dashboard.tsx`) is architected for **immediate clarity within 10–15 seconds** for non-technical viewers while preserving full engineering depth via **progressive disclosure** (`Simple View` vs. `Technical View`):

1. **Hero Section** ([`HeroSection.tsx`](file:///a:/GridAgent/frontend/components/HeroSection.tsx)): *"Run Cloud Workloads When Energy Is Cleaner"* — displays 3 live metrics (**Carbon**, **Renewable Energy**, **AI Recommendation**) and **▶ Run Digital Twin Simulation** / **🎬 Demo Mode** CTAs.
2. **Live Digital Twin & Current Situation** ([`DigitalTwin.tsx`](file:///a:/GridAgent/frontend/components/DigitalTwin.tsx)):
   - Visual bridge connecting **Physical World** (`☀ Solar & Wind Farm`, `⚡ Energy Grid`, `🏢 Cloud Data Center`, `🔋 Clean Energy Storage`) `⇅ LIVE SYNC` **Digital Twin**.
   - Animated energy conduits, 4 server racks (`Server 01–04`), spinning cooling fans, active workload progress bar, AI Decision Brain, **Interactive Twin Parameters** (Duration, Deadline, Priority, Grid Carbon slider, Solar MW slider), and a **24-hour draggable timeline slider**.
3. **"What If?" Simulation** ([`WhatIfSimulation.tsx`](file:///a:/GridAgent/frontend/components/WhatIfSimulation.tsx)):
   - Side-by-side comparison of **🔴 RUN NOW** vs. **🟢 WAIT FOR CLEANER ENERGY**, showing calculated carbon (`kgCO₂`), cost (`$`), candidate execution windows, and trustworthy `0%` explanations when deadlines prevent deferral.
4. **Plain-English AI Explanation & Traffic-Light Safety Check** ([`AIRecommendationAndSafety.tsx`](file:///a:/GridAgent/frontend/components/AIRecommendationAndSafety.tsx)):
   - *"Why did the AI choose this?"* (numbered human-readable reasons) + *"AI Safety Check"* (`🟢 ALLOW`, `🟡 ASK USER`, `🔴 BLOCK`) with interactive operator Approve/Reject controls.
5. **24-Hour Energy Map** ([`EnergyMap24h.tsx`](file:///a:/GridAgent/frontend/components/EnergyMap24h.tsx)):
   - Interactive 24-hour block timeline (`🔴 High carbon`, `🟡 Medium`, `🟢 Low carbon`) with `↑ NOW`, `★ BEST WINDOW`, and `⚑ DEADLINE` markers.
6. **Cloud Workload Cards** ([`WorkloadCardsGrid.tsx`](file:///a:/GridAgent/frontend/components/WorkloadCardsGrid.tsx)):
   - Visual workload cards (click any card to load it into the Digital Twin) + 5 canonical scenario presets.
7. **Before vs. After Impact** ([`BeforeAfterImpact.tsx`](file:///a:/GridAgent/frontend/components/BeforeAfterImpact.tsx)):
   - *"The Impact of Smart Scheduling"* — *"Same workload. Same output. Cleaner electricity."*
8. **Visual Multi-Agent System** ([`VisualAgentFlow.tsx`](file:///a:/GridAgent/frontend/components/VisualAgentFlow.tsx)):
   - **`👁 OBSERVE → 🧠 THINK → 🛡 CHECK → ⚡ ACT`** with click-to-expand live agent logs.
9. **Expandable Technical Details (`🔬 Technical Details`)**:
   - Collapsed by default in `Simple View`; reveals the full enterprise [`WorkloadTable.tsx`](file:///a:/GridAgent/frontend/components/WorkloadTable.tsx) (with Pydantic JSON output), [`AgentActivityFeed.tsx`](file:///a:/GridAgent/frontend/components/AgentActivityFeed.tsx), [`BeforeAfterComparison.tsx`](file:///a:/GridAgent/frontend/components/BeforeAfterComparison.tsx), and [`SafetyAndMcpPanel.tsx`](file:///a:/GridAgent/frontend/components/SafetyAndMcpPanel.tsx) (16 MCP tools + SQLite audit trail).
10. **Floating Simulation Control Bar** ([`SimulationControlBar.tsx`](file:///a:/GridAgent/frontend/components/SimulationControlBar.tsx)):
    - `[▶ PLAY] / [⏸ PAUSE]`, `[↺ RESET]`, `Simulation Time`, `[-1 HOUR] / [+1 HOUR]`, `Speed: 1x | 2x | 5x`, and **`⚡ Simulate AI Decision`**.
11. **Guided Judge / Demo Mode** ([`JudgeModeOverlay.tsx`](file:///a:/GridAgent/frontend/components/JudgeModeOverlay.tsx)):
    - 6-step guided interactive presentation (`🎬 Demo Mode`) walking through the problem, Digital Twin forecast, 17:00 clean window discovery, safety check, workload shift, and final carbon/cost savings.

---

## 3. Setup & Running Instructions

### Step 1: Start the FastAPI Backend (Port 8000)
```powershell
py -3.12 -m pip install -r requirements.txt
py -3.12 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Step 2: Start the React + TypeScript Frontend (Port 5173)
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Step 3: Run Automated Tests
```powershell
py -3.12 -m pytest -v
```
