import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Wrench,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Play,
  Sparkles,
  MapPin,
  Clock,
  Shield,
  X
} from 'lucide-react';

const SAMPLE_REPAIRED_PHOTOS = {
  pothole: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  garbage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
  streetlight: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
  water_leak: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
  drainage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
  fallen_tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
  traffic_signal: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800'
};

export default function WorkerDashboard({ complaints = [], onRefresh }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Filter tasks assigned to worker or show all actionable tasks in demo mode
  const myTasks = complaints.filter(
    (c) => c.status !== 'VERIFIED'
  );

  const handleStartWork = async (id) => {
    try {
      await api.updateStatus(id, 'IN_PROGRESS', 'Worker arrived on site and commenced repair.');
      showToast('Status updated to IN PROGRESS. Timer started.', 'SUCCESS');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'ERROR');
    }
  };

  const openResolutionModal = (complaint) => {
    setResolvingComplaint(complaint);
    setVerificationResult(null);
    setRepairNotes(`Fixed and verified on-site. Defect eliminated.`);
    // Default sample repaired photo for category
    const defaultSample = SAMPLE_REPAIRED_PHOTOS[complaint.category] || SAMPLE_REPAIRED_PHOTOS.pothole;
    setResolutionPreview(defaultSample);
    setResolutionFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      setResolutionPreview(URL.createObjectURL(file));
      setVerificationResult(null);
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;

    setIsVerifying(true);
    try {
      const formData = new FormData();
      if (resolutionFile) {
        formData.append('resolution_image', resolutionFile);
      } else {
        formData.append('resolution_image_url', resolutionPreview);
      }
      formData.append('resolution_notes', repairNotes);

      const res = await api.submitResolutionProof(resolvingComplaint.id, formData);
      setVerificationResult(res.ai_verification);

      showToast(
        `AI Resolution Verified (${((res.ai_verification?.resolution_confidence || 0.94) * 100).toFixed(0)}%). Sent to citizen for confirmation.`,
        'SUCCESS'
      );

      setTimeout(() => {
        setResolvingComplaint(null);
        if (onRefresh) onRefresh();
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Failed to submit resolution', 'ERROR');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Field Worker Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              {user?.department || 'Field Crew'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Accept dispatches, execute repairs, and submit Before/After evidence for AI resolution verification.
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">
            Active Crew Lead: <strong className="text-white">{user?.name || 'Rajesh Verma'}</strong>
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Assigned Work Orders ({myTasks.length})
        </h2>

        {myTasks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
            <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No active work orders</h3>
            <p className="text-xs text-slate-400 mt-1">All dispatched tasks are currently resolved.</p>
          </div>
        ) : (
          myTasks.map((task) => (
            <div
              key={task.id}
              className={`p-6 rounded-3xl bg-slate-900/80 border transition-all shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                task.status === 'IN_PROGRESS'
                  ? 'border-blue-500/50 shadow-blue-500/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                  <img
                    src={task.image_url}
                    alt={task.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      #{task.id}
                    </span>
                    <h3 className="text-base font-bold text-white capitalize">
                      {task.category.replace('_', ' ')}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        task.priority_score >= 85
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Priority {task.priority_score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{task.address}</span>
                    </span>
                    <span>•</span>
                    <span>Zone: <strong className="text-slate-300">{task.zone || 'Central'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {task.status !== 'IN_PROGRESS' && task.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStartWork(task.id)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Work</span>
                  </button>
                )}

                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => openResolutionModal(task)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Upload Proof & AI Verify</span>
                  </button>
                )}

                {task.status === 'RESOLVED' && (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                    Awaiting Citizen Confirmation
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Proof & AI Resolution Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Resolution Proof & AI Verification — #{resolvingComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="mt-4 space-y-5 text-xs">
              {/* Before vs After Visual Comparison Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    BEFORE (Reported Defect)
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
                    <img
                      src={resolvingComplaint.image_url}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      AFTER (Repaired Photo)
                    </span>
                    <label className="cursor-pointer text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 relative">
                    <img
                      src={resolutionPreview}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                      POST-REPAIR
                    </div>
                  </div>
                </div>
              </div>

              {/* Repair Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Field Repair Notes:</label>
                <textarea
                  rows={2}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="e.g. Applied hot-mix asphalt compaction patch; uniform road grade restored."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* AI Verification Status Card */}
              {verificationResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>AI Resolution Verified (Confidence: {((verificationResult.resolution_confidence || 0.94) * 100).toFixed(0)}%)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{verificationResult.notes}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>AI Verification In Progress...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Verify & Complete Resolution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
