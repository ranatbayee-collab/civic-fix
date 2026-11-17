import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import BeforeAfterSlider from '../components/common/BeforeAfterSlider';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  MapPin,
  ChevronRight
} from 'lucide-react';

const STATUS_STEPS = [
  'REPORTED',
  'AI_VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED'
];

export default function CitizenDashboard({ complaints = [], onRefresh, onNewReport }) {
  const { showToast } = useNotifications();
  const [filterTab, setFilterTab] = useState('ALL');
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const filtered = complaints.filter((c) => {
    if (filterTab === 'ACTIVE') return c.status !== 'RESOLVED' && c.status !== 'VERIFIED';
    if (filterTab === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'VERIFIED';
    if (filterTab === 'NEED_VERIFY') return c.status === 'RESOLVED';
    return true;
  });

  const handleCitizenConfirmation = async (complaintId, confirmed) => {
    setIsSubmittingFeedback(true);
    try {
      const res = await api.citizenConfirm(complaintId, {
        confirmed,
        satisfaction: confirmed ? 5 : 1,
        comment: feedbackComment || (confirmed ? 'Citizen verified repair quality.' : 'Issue persists on site.')
      });

      if (confirmed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast('🎉 Resolution verified! Thank you for helping keep the city clean and safe!', 'SUCCESS');
      } else {
        showToast('⚠️ Complaint reopened and supervisor dispatched.', 'WARNING');
      }

      setFeedbackComment('');
      setActiveComplaint(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to submit confirmation', 'ERROR');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'REOPENED') return 3; // equivalent to in progress
    const idx = STATUS_STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Citizen Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your submitted civic complaints across the full AI lifecycle pipeline.
          </p>
        </div>
        <button
          onClick={onNewReport}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-cyan-500/20"
        >
          + Report New Problem
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit mb-6 text-xs">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filterTab === 'ALL'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Reports ({complaints.length})
        </button>
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filterTab === 'ACTIVE'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          In Progress ({complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length})
        </button>
        <button
          onClick={() => setFilterTab('NEED_VERIFY')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
            filterTab === 'NEED_VERIFY'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-amber-400 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Awaiting My Confirmation ({complaints.filter((c) => c.status === 'RESOLVED').length})</span>
        </button>
        <button
          onClick={() => setFilterTab('RESOLVED')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            filterTab === 'RESOLVED'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Completed ({complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length})
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No reports found in this category</h3>
            <p className="text-xs text-slate-400 mt-1">Submit your first civic report to activate the AI lifecycle.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const currentStepIdx = getStepIndex(item.status);
            const needsConfirmation = item.status === 'RESOLVED';

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl bg-slate-900/80 border transition-all shadow-xl ${
                  needsConfirmation
                    ? 'border-amber-500/50 shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          #{item.id}
                        </span>
                        <h3 className="text-base font-bold text-white capitalize">
                          {item.category.replace('_', ' ')}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.priority_score >= 85
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          Priority {item.priority_score}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{item.address}</span>
                        </span>
                        <span>•</span>
                        <span>Dept: <strong className="text-cyan-300">{item.department}</strong></span>
                        {item.assigned_worker_name && (
                          <>
                            <span>•</span>
                            <span>Worker: <strong className="text-slate-200">{item.assigned_worker_name}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="flex flex-col sm:items-end gap-1">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider text-center ${
                        item.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.status === 'RESOLVED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Reported {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status Pipeline Visualizer */}
                <div className="pt-5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {STATUS_STEPS.map((step, idx) => {
                      const isPast = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div
                          key={step}
                          className={`flex items-center gap-1 ${
                            isCurrent
                              ? 'text-cyan-400 font-black'
                              : isPast
                              ? 'text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCurrent
                                ? 'bg-cyan-400 animate-ping'
                                : isPast
                                ? 'bg-emerald-400'
                                : 'bg-slate-700'
                            }`}
                          />
                          <span className="hidden sm:inline">{step.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Line */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((currentStepIdx + 1) / STATUS_STEPS.length) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* CITIZEN CONFIRMATION PROMPT CARD (for RESOLVED status) */}
                {needsConfirmation && (
                  <div className="mt-6 p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> Citizen Confirmation Required
                      </div>
                      {item.ai_verification_meta && (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          AI Resolution Confidence: {((item.ai_verification_meta.resolution_confidence || 0.93) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-4">
                      The field worker has marked this problem as repaired. Please inspect the before & after evidence below and confirm if the defect is completely resolved.
                    </p>

                    {/* Dual Before / After Slider */}
                    {item.resolution_image_url && (
                      <div className="mb-4 max-w-xl mx-auto">
                        <BeforeAfterSlider
                          beforeUrl={item.image_url}
                          afterUrl={item.resolution_image_url}
                          category={item.category}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Optional feedback comment..."
                        value={activeComplaint === item.id ? feedbackComment : ''}
                        onChange={(e) => {
                          setActiveComplaint(item.id);
                          setFeedbackComment(e.target.value);
                        }}
                        className="w-full sm:w-80 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleCitizenConfirmation(item.id, false)}
                          disabled={isSubmittingFeedback}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Issue Persists (Reopen)</span>
                        </button>
                        <button
                          onClick={() => handleCitizenConfirmation(item.id, true)}
                          disabled={isSubmittingFeedback}
                          className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Confirm Fixed</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
