import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import {
  ShieldAlert,
  Activity,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';

export default function AdminDashboard({ complaints = [], onRefresh }) {
  const { showToast } = useNotifications();
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [aData, wData] = await Promise.all([
          api.getAnalytics(),
          api.getWorkers()
        ]);
        setAnalytics(aData);
        setWorkers(wData.workers || []);
      } catch (e) {}
    }
    loadData();
  }, [complaints]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assigningComplaint || !selectedWorkerId) return;

    setIsSubmitting(true);
    try {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      await api.assignWorker(assigningComplaint.id, {
        worker_id: selectedWorkerId,
        worker_name: worker ? worker.name : 'Field Crew',
        notes: assignNotes
      });
      showToast(`Task #${assigningComplaint.id} assigned to ${worker?.name || 'Worker'}`, 'SUCCESS');
      setAssigningComplaint(null);
      setSelectedWorkerId('');
      setAssignNotes('');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to assign worker', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEmergency = async (complaintId) => {
    try {
      const res = await api.toggleEmergency(complaintId);
      showToast(res.message || 'Emergency status updated', 'WARNING');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Error updating emergency', 'ERROR');
    }
  };

  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const cityHealth = analytics?.city_health?.overall || 78;
  const healthBreakdown = analytics?.city_health?.breakdown || {
    Roads: 71,
    Sanitation: 84,
    Water: 76,
    Lighting: 82,
    Drainage: 69
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
              Control Room
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time municipal telemetry, AI routing dispatch, and infrastructure health score.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          🔄 Refresh Telemetry
        </button>
      </div>

      {/* City Health Score & KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* City Health Score Widget (4 cols) */}
        <div className="md:col-span-4 p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              City Health Score
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              AI REAL-TIME
            </span>
          </div>

          <div className="my-4 text-center">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 font-mono">
              {cityHealth}/100
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {cityHealth >= 80 ? 'Optimal Infrastructure State' : 'Moderate Attention Required'}
            </p>
          </div>

          {/* Subscores breakdown */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            {Object.entries(healthBreakdown).slice(0, 5).map(([dept, score]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-slate-400">{dept}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        score >= 80 ? 'bg-emerald-400' : score >= 70 ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-200 w-8 text-right">{score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Stat Counters (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{complaints.length}</div>
            <div className="text-xs text-slate-400 mt-1">Total Reports</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {complaints.filter((c) => c.status === 'REPORTED' || c.status === 'AI_VERIFIED' || c.status === 'ASSIGNED').length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Pending Dispatch</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {complaints.filter((c) => c.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-xs text-slate-400 mt-1">In Progress</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Resolved Fixed</div>
          </div>

          {/* Department Performance Overview Bar */}
          <div className="col-span-2 sm:col-span-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Department Fleet Readiness & Active Dispatches
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Road Maintenance</div>
                <div className="font-bold text-cyan-300 mt-0.5">14 Active Workers</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Sanitation Fleet</div>
                <div className="font-bold text-cyan-300 mt-0.5">22 Active Workers</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Electrical Dept</div>
                <div className="font-bold text-cyan-300 mt-0.5">9 Active Workers</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Water & Drainage</div>
                <div className="font-bold text-cyan-300 mt-0.5">19 Active Workers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Management Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Live Complaint Feed</h2>
            <span className="text-xs text-slate-400 font-mono">({filtered.length} matching)</span>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlight</option>
              <option value="water_leak">Water Leak</option>
              <option value="drainage">Drainage</option>
              <option value="fallen_tree">Fallen Tree</option>
              <option value="traffic_signal">Traffic Signal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Worker</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">#{item.id}</td>
                  <td className="py-3 px-4 capitalize font-semibold text-white">
                    {item.category.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate">{item.address}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                        item.priority_score >= 85
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.priority_score >= 70
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {item.priority_score}/100
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyan-300">{item.department}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {item.assigned_worker_name || <span className="text-slate-500 italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'RESOLVED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setAssigningComplaint(item)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition-colors"
                      >
                        {item.assigned_to ? 'Reassign' : 'Assign'}
                      </button>
                      <button
                        onClick={() => handleToggleEmergency(item.id)}
                        className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
                          item.is_emergency
                            ? 'bg-rose-500/30 border-rose-500 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                        }`}
                        title="Toggle Emergency Escalation"
                      >
                        <Flame className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Worker Modal */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Assign Worker — #{assigningComplaint.id}
              </h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Department:</label>
                <input
                  type="text"
                  value={assigningComplaint.department}
                  disabled
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Field Officer / Worker:</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Choose Field Personnel --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department || 'General Fleet'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dispatch Instructions / Notes:</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Bring cold-mix asphalt truck, clear before peak hours..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedWorkerId}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
