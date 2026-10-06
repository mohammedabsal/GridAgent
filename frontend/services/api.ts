export interface GridStatus {
  current_time: string;
  current_hour: number;
  carbon_intensity_gco2_kwh: number;
  renewable_percentage: number;
  solar_generation_mw: number;
  wind_generation_mw: number;
  demand_mw: number;
  electricity_price_usd_kwh: number;
  grid_status_label: string;
  grid_regime: string;
  weather_condition: string;
  data_source: string;
  is_simulated: boolean;
  cloud_capacity_utilization_pct: number;
}

export interface GridHourlyPoint {
  hour: number;
  time_str: string;
  carbon_intensity_gco2_kwh: number;
  solar_generation_mw: number;
  wind_generation_mw: number;
  renewable_percentage: number;
  demand_mw: number;
  electricity_price_usd_kwh: number;
  grid_regime: string;
  weather_condition: string;
  is_simulated: boolean;
}

export interface CandidateWindow {
  start_hour: number;
  start_time: string;
  end_hour: number;
  end_time: string;
  avg_carbon_intensity: number;
  avg_solar_mw: number;
  avg_renewable_pct: number;
  avg_price_usd_kwh: number;
  estimated_emissions_gco2: number;
  estimated_cost_usd: number;
  composite_score?: number;
  meets_deadline: boolean;
}

export interface WorkloadJob {
  job_id: string;
  name: string;
  workload_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  duration_minutes: number;
  deadline: string;
  energy_kwh: number;
  estimated_cloud_cost_usd: number;
  submitted_at_time: string;
  status:
    | 'QUEUED'
    | 'RUNNING'
    | 'PAUSED'
    | 'DEFERRED'
    | 'COMPLETED'
    | 'FAILED'
    | 'BLOCKED'
    | 'AWAITING_APPROVAL'
    | 'CANCELLED';
  recommended_start_time?: string;
  actual_start_time?: string;
  completed_at_time?: string;
  current_carbon_intensity?: number;
  predicted_carbon_intensity?: number;
  baseline_emissions_gco2: number;
  optimized_emissions_gco2: number;
  estimated_carbon_savings_gco2: number;
  carbon_reduction_pct: number;
  baseline_cost_usd: number;
  optimized_cost_usd: number;
  estimated_cost_savings_usd: number;
  cost_reduction_pct: number;
  decision?: string;
  decision_reason?: string;
  policy_decision?: string;
  policy_reason?: string;
  confidence?: number;
  region: string;
  is_protected_service: boolean;
  candidate_windows?: CandidateWindow[];
}

export interface AgentActivityEvent {
  id: string;
  timestamp: string;
  simulation_time: string;
  stage: 'PERCEIVE' | 'WORKLOAD' | 'REASON' | 'SAFETY' | 'EXECUTE';
  agent_name: string;
  job_id?: string;
  title: string;
  message: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  metadata: Record<string, unknown>;
}

export interface JobComparisonItem {
  job_id: string;
  name: string;
  workload_type: string;
  status: string;
  decision: string;
  policy_decision: string;
  submitted_at: string;
  recommended_start: string;
  deadline: string;
  energy_kwh: number;
  current_carbon: number;
  predicted_carbon: number;
  baseline_emissions_gco2: number;
  optimized_emissions_gco2: number;
  carbon_saved_gco2: number;
  carbon_reduction_pct: number;
  baseline_cost_usd: number;
  optimized_cost_usd: number;
  cost_saved_usd: number;
  cost_reduction_pct: number;
  reason: string;
}

export interface ComparisonMetrics {
  total_jobs_evaluated: number;
  optimized_jobs_count: number;
  blocked_jobs_count: number;
  awaiting_approval_count: number;
  baseline_total_emissions_gco2: number;
  optimized_total_emissions_gco2: number;
  total_carbon_saved_gco2: number;
  carbon_reduction_percentage: number;
  baseline_total_cost_usd: number;
  optimized_total_cost_usd: number;
  total_cost_saved_usd: number;
  cost_reduction_percentage: number;
  job_comparisons: JobComparisonItem[];
}

export interface DemoScenarioMeta {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  expected_outcome: string;
  job_spec: {
    job_id: string;
    name: string;
    workload_type: string;
    priority: string;
    duration_minutes: number;
    deadline: string;
    energy_kwh: number;
    estimated_cloud_cost_usd: number;
  };
}

export interface PolicyAuditLog {
  id: number;
  timestamp: string;
  job_id: string;
  workload_type: string;
  proposed_decision: string;
  policy_decision: string;
  rule_matched: string;
  reason: string;
}

export interface MCPToolSchema {
  name: string;
  category: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface DashboardState {
  grid_status: GridStatus;
  forecast_24h: GridHourlyPoint[];
  historical_24h: GridHourlyPoint[];
  available_profiles: string[];
  active_profile: string;
  workloads: WorkloadJob[];
  agent_events: AgentActivityEvent[];
  comparison: ComparisonMetrics;
  policy_rules: {
    DENY: string[];
    ALLOW: string[];
    ASK_USER: string[];
  };
  policy_audit_logs: PolicyAuditLog[];
  demo_scenarios: DemoScenarioMeta[];
  mcp_tools: MCPToolSchema[];
}

const API_BASE = '/api';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error (${res.status}): ${errText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: () => requestJson<DashboardState>('/dashboard'),

  stepSimulation: (hours = 1) =>
    requestJson<unknown>(`/simulation/step?hours=${hours}`, { method: 'POST' }),

  updateSimulation: (
    payload: {
      current_hour?: number;
      profile?: string;
      override_current_carbon?: number | null;
      override_current_solar_mw?: number | null;
      cloud_capacity_utilization_pct?: number;
    },
    reEvaluate = false
  ) =>
    requestJson<unknown>(`/simulation/update?re_evaluate=${reEvaluate}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetSimulation: (seedScenario1 = false) =>
    requestJson<DashboardState>(
      `/simulation/reset?seed_scenario_1=${seedScenario1}`,
      { method: 'POST' }
    ),

  submitWorkload: (payload: {
    job_id?: string;
    name: string;
    workload_type: string;
    priority: string;
    duration_minutes: number;
    deadline: string;
    energy_kwh: number;
    estimated_cloud_cost_usd?: number;
    auto_orchestrate?: boolean;
  }) =>
    requestJson<unknown>('/workloads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  configureWorkload: (
    jobId: string,
    payload: {
      duration_minutes?: number;
      deadline?: string;
      priority?: string;
      energy_kwh?: number;
      workload_type?: string;
      estimated_cloud_cost_usd?: number;
    }
  ) =>
    requestJson<unknown>(`/workloads/${encodeURIComponent(jobId)}/configure`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  orchestrateWorkload: (jobId: string) =>
    requestJson<unknown>(`/workloads/${encodeURIComponent(jobId)}/orchestrate`, {
      method: 'POST',
    }),

  workloadAction: (
    jobId: string,
    action: string,
    recommendedStartTime?: string
  ) =>
    requestJson<unknown>(`/workloads/${encodeURIComponent(jobId)}/action`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        recommended_start_time: recommendedStartTime,
      }),
    }),

  runScenario: (scenarioId: string, resetFirst = false) =>
    requestJson<unknown>(
      `/scenarios/${encodeURIComponent(scenarioId)}/run?reset_first=${resetFirst}`,
      { method: 'POST' }
    ),

  runAllScenarios: () =>
    requestJson<unknown>('/scenarios/run-all', { method: 'POST' }),

  runJudgeWalkthrough: () =>
    requestJson<unknown>('/scenarios/walkthrough', { method: 'POST' }),

  callMcpTool: (toolName: string, args: Record<string, unknown>) =>
    requestJson<{ tool: string; category: string; result: unknown }>(
      '/mcp/call',
      {
        method: 'POST',
        body: JSON.stringify({ tool_name: toolName, arguments: args }),
      }
    ),
};
