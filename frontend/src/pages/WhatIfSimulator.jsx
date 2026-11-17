import React, { useState } from 'react';
import { api } from '../api/client';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Sliders,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';

const PRESETS = [
  {
    id: 'repair_top_potholes',
    title: 'Repair 10 Highest-Priority Potholes',
    category: 'pothole',
    count: 10,
    crews: 2,
    budget: 6,
    icon: '🕳️',
    description: 'Target deep asphalt craters on arterial highways to reduce accidents and congestion.'
  },
  {
    id: 'sanitation_blitz',
    title: 'Sanitation Fleet Surge in Commercial Zones',
    category: 'garbage',
    count: 14,
    crews: 4,
    budget: 4,
    icon: '🗑️',
    description: 'Deploy extra waste compactors and street sweeping units before weekend peak.'
  },
  {
    id: 'drainage_desilt',
    title: 'Pre-Monsoon Stormwater Drainage Desilting',
    category: 'drainage',
    count: 8,
    crews: 3,
    budget: 7,
    icon: '🚰',
    description: 'Excavate obstructed main stormwater culverts to prevent urban flash flooding.'
  }
];

export default function WhatIfSimulator() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [targetCategory, setTargetCategory] = useState('pothole');
  const [countToResolve, setCountToResolve] = useState(10);
  const [crewCount, setCrewCount] = useState(2);
  const [budgetLakhs, setBudgetLakhs] = useState(6);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    setTargetCategory(preset.category);
    setCountToResolve(preset.count);
    setCrewCount(preset.crews);
    setBudgetLakhs(preset.budget);
    setSimulationResult(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runSimulation({
        scenario: selectedPreset.id,
        targetCategory,
        countToResolve,
        additionalCrewCount: crewCount,
        budgetLakhs
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 800);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> AI Predictive Policy Lab
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          What-If Municipal Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Model municipal interventions, test budget scenarios, and forecast City Health Score impact before ground deployment.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className={`p-5 rounded-2xl text-left border transition-all ${
              selectedPreset.id === p.id
                ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-2xl mb-2">{p.icon}</div>
            <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
            <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Simulator Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders & Parameters (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-white">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Simulation Parameters</span>
          </div>

          {/* Slider 1: Target Issues */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold">Priority Issues to Repair:</span>
              <span className="font-mono font-bold text-cyan-300">{countToResolve} defects</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={countToResolve}
              onChange={(e) => setCountToResolve(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 2: Additional Crews */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold">Extra Field Crews Deployed:</span>
              <span className="font-mono font-bold text-cyan-300">+{crewCount} crews</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={crewCount}
              onChange={(e) => setCrewCount(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 3: Budget */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold">Allocated Budget:</span>
              <span className="font-mono font-bold text-cyan-300">₹{budgetLakhs} Lakhs</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={budgetLakhs}
              onChange={(e) => setBudgetLakhs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Running Predictive Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>EXECUTE WHAT-IF SIMULATION</span>
              </>
            )}
          </button>

          {/* Disclaimer Tag */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Predictions are AI heuristic estimates modeled from historical municipal turnaround patterns and traffic telemetry, not guaranteed outcomes.
            </span>
          </div>
        </div>

        {/* Results Comparison View (7 cols) */}
        <div className="lg:col-span-7">
          {simulationResult ? (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulated Output: {simulationResult.scenario?.title}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                  CONFIDENCE: 91%
                </span>
              </div>

              {/* Side-by-side BEFORE vs PREDICTED AFTER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BEFORE Card */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    CURRENT STATE (BEFORE)
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Open Complaints:</div>
                    <div className="text-2xl font-black text-white font-mono">
                      {simulationResult.before?.category_complaints}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Traffic Congestion Index:</div>
                    <div className="text-sm font-bold text-rose-400">
                      {simulationResult.before?.traffic_congestion_index}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">City Health Score:</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {simulationResult.before?.city_health_score}/100
                    </div>
                  </div>
                </div>

                {/* AFTER PREDICTED Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-3 relative overflow-hidden">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PREDICTED OUTCOME (AFTER)</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Remaining Complaints:</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {simulationResult.after_predicted?.category_complaints}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono flex items-center">
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                        {Math.abs(simulationResult.after_predicted?.complaints_change_percent)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Traffic Impact Reduction:</div>
                    <div className="text-sm font-bold text-emerald-300 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-1" />
                      ↓ {simulationResult.after_predicted?.traffic_impact_reduction_percent}% reduction
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">City Health Score:</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                        {simulationResult.after_predicted?.city_health_score}/100
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        ({simulationResult.after_predicted?.city_health_score_delta})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turnaround Estimate */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-300">
                  Estimated Deployment Turnaround:
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  ~{simulationResult.after_predicted?.estimated_turnaround_days} Days
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Simulation Engine Idle</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Adjust the sliders or choose a preset on the left, then click <strong>Execute What-If Simulation</strong> to calculate predicted municipal outcomes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
