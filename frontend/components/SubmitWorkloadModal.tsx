import React, { useState } from 'react';
import { Sliders, X, Zap } from 'lucide-react';

interface SubmitWorkloadModalProps {
  isOpen: boolean;
  currentCarbon: number;
  currentSolar: number;
  onClose: () => void;
  onSubmitJob: (payload: {
    job_id?: string;
    name: string;
    workload_type: string;
    priority: string;
    duration_minutes: number;
    deadline: string;
    energy_kwh: number;
    estimated_cloud_cost_usd?: number;
  }) => Promise<void>;
  onOverrideGrid: (payload: {
    override_current_carbon?: number;
    override_current_solar_mw?: number;
  }) => Promise<void>;
}

export const SubmitWorkloadModal: React.FC<SubmitWorkloadModalProps> = ({
  isOpen,
  currentCarbon,
  currentSolar,
  onClose,
  onSubmitJob,
  onOverrideGrid,
}) => {
  const [jobId, setJobId] = useState('AI-CUSTOM-010');
  const [name, setName] = useState('Vision Transformer Training Run');
  const [workloadType, setWorkloadType] = useState('ai_model_training');
  const [priority, setPriority] = useState('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [deadline, setDeadline] = useState('20:00');
  const [energyKwh, setEnergyKwh] = useState(150);
  const [estimatedCost, setEstimatedCost] = useState(35);

  const [customCarbon, setCustomCarbon] = useState<number>(currentCarbon);
  const [customSolar, setCustomSolar] = useState<number>(currentSolar);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitJob({
        job_id: jobId.trim() || undefined,
        name,
        workload_type: workloadType,
        priority,
        duration_minutes: Number(durationMinutes),
        deadline,
        energy_kwh: Number(energyKwh),
        estimated_cloud_cost_usd: Number(estimatedCost),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGridOverride = async () => {
    setSubmitting(true);
    try {
      await onOverrideGrid({
        override_current_carbon: Number(customCarbon),
        override_current_solar_mw: Number(customSolar),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Submit Enterprise Cloud Workload &amp; Simulation Tuning
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-400 mb-1">Job ID</label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Workload Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Workload Type (Policy Evaluated)
              </label>
              <select
                value={workloadType}
                onChange={(e) => setWorkloadType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
              >
                <optgroup label="ALLOW (Flexible Cloud Jobs)">
                  <option value="ai_model_training">ai_model_training</option>
                  <option value="batch_analytics_job">batch_analytics_job</option>
                  <option value="video_rendering">video_rendering</option>
                  <option value="database_indexing">database_indexing</option>
                  <option value="large_data_processing">
                    large_data_processing
                  </option>
                </optgroup>
                <optgroup label="ASK_USER (Requires Human Approval)">
                  <option value="high_cost_cloud_migration">
                    high_cost_cloud_migration
                  </option>
                </optgroup>
                <optgroup label="DENY (Protected Mission-Critical Services)">
                  <option value="production_web_server">
                    production_web_server
                  </option>
                  <option value="emergency_database">emergency_database</option>
                  <option value="health_tech_api">health_tech_api</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Job Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
              >
                <option value="LOW">LOW (Maximum Carbon Flexibility)</option>
                <option value="MEDIUM">MEDIUM (Standard Carbon Optimization)</option>
                <option value="HIGH">HIGH (Defer Only for Large Savings)</option>
                <option value="CRITICAL">
                  CRITICAL (Run Immediately — No Deferral)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Execution Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                SLA Deadline (HH:00)
              </label>
              <select
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
              >
                {Array.from({ length: 24 }, (_, h) => {
                  const t = `${String(h).padStart(2, '0')}:00`;
                  return (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Estimated Energy Consumption (kWh)
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                value={energyKwh}
                onChange={(e) => setEnergyKwh(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Estimated Cloud Cost ($ USD — &gt;$500 triggers ASK_USER)
              </label>
              <input
                type="number"
                min={1}
                max={5000}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              {submitting
                ? 'Running Multi-Agent Pipeline...'
                : 'Submit & Orchestrate (PERCEIVE → REASON → SAFETY → EXECUTE)'}
            </button>
          </div>
        </form>

        {/* Custom Grid Parameter Overrides */}
        <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Sliders className="h-4 w-4 text-sky-400" />
            Custom Grid Telemetry Override (Current Hour)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">
                Override Current Carbon Intensity (gCO₂/kWh)
              </label>
              <input
                type="number"
                min={50}
                max={1000}
                value={customCarbon}
                onChange={(e) => setCustomCarbon(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Override Current Solar Generation (MW)
              </label>
              <input
                type="number"
                min={0}
                max={8000}
                value={customSolar}
                onChange={(e) => setCustomSolar(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleGridOverride}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs transition"
          >
            Apply Grid Telemetry Override
          </button>
        </div>
      </div>
    </div>
  );
};
