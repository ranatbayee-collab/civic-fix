import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  Search,
  X
} from 'lucide-react';

const PRIORITY_MARKER_COLORS = {
  CRITICAL: '#ef4444', // Red
  HIGH: '#f97316',     // Orange
  MEDIUM: '#eab308',   // Yellow
  RESOLVED: '#10b981'  // Green
};

function createCustomIcon(color, category, priority, isResolved) {
  const iconEmoji = {
    pothole: '🕳️',
    garbage: '🗑️',
    streetlight: '💡',
    water_leak: '💧',
    drainage: '🚰',
    fallen_tree: '🌳',
    traffic_signal: '🚦'
  }[category] || '📍';

  const markerHtml = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; cursor: pointer;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}25; border: 2px solid ${color}; animation: pulse 2s infinite;"></div>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 10px ${color}80;">
        ${iconEmoji}
      </div>
      <div style="position: absolute; bottom: -8px; padding: 1px 4px; border-radius: 4px; background: #020617; border: 1px solid ${color}; font-size: 8px; font-weight: bold; color: ${color}; font-family: monospace;">
        ${isResolved ? 'FIXED' : priority}
      </div>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'civic-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

export default function CivicMap({ complaints = [], onSelectComplaint }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map centered at Bhubaneswar Smart City hub
    const map = L.map(mapContainerRef.current, {
      center: [20.2961, 85.8245],
      zoom: 13,
      zoomControl: false
    });

    // Dark sleek CartoDB tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when complaints or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    const filtered = complaints.filter((c) => {
      if (filterCategory !== 'ALL' && c.category !== filterCategory) return false;
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'VERIFIED') return false;
        if (filterStatus === 'ACTIVE' && (c.status === 'RESOLVED' || c.status === 'VERIFIED')) return false;
        if (filterStatus === 'CRITICAL' && c.priority_score < 85) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.id.toLowerCase().includes(q) &&
          !c.address.toLowerCase().includes(q) &&
          !c.description.toLowerCase().includes(q) &&
          !c.category.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    filtered.forEach((c) => {
      const isResolved = c.status === 'RESOLVED' || c.status === 'VERIFIED';
      let color = PRIORITY_MARKER_COLORS.MEDIUM;
      if (isResolved) color = PRIORITY_MARKER_COLORS.RESOLVED;
      else if (c.priority_score >= 85) color = PRIORITY_MARKER_COLORS.CRITICAL;
      else if (c.priority_score >= 70) color = PRIORITY_MARKER_COLORS.HIGH;

      const marker = L.marker([c.latitude, c.longitude], {
        icon: createCustomIcon(color, c.category, c.priority_score, isResolved)
      });

      marker.on('click', () => {
        setSelectedComplaint(c);
        mapInstanceRef.current.setView([c.latitude, c.longitude], 15, { animate: true });
        if (onSelectComplaint) onSelectComplaint(c);
      });

      markersGroup.addLayer(marker);
    });
  }, [complaints, filterCategory, filterStatus, searchQuery]);

  const categories = [
    { id: 'ALL', label: 'All Issues' },
    { id: 'pothole', label: '🕳️ Potholes' },
    { id: 'garbage', label: '🗑️ Garbage' },
    { id: 'streetlight', label: '💡 Streetlights' },
    { id: 'water_leak', label: '💧 Water Leaks' },
    { id: 'drainage', label: '🚰 Drainage' },
    { id: 'fallen_tree', label: '🌳 Fallen Trees' },
    { id: 'traffic_signal', label: '🚦 Signals' }
  ];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Filter Controls HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-2xl pointer-events-auto">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search area, #ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-52"
            />
          </div>

          {/* Category Dropdown/Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Legend Pill */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-2xl pointer-events-auto text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Critical (85+)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>High (70+)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* Selected Complaint Detail Panel */}
      {selectedComplaint && (
        <div className="absolute top-20 right-6 w-96 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl z-20 animate-fadeIn text-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                #{selectedComplaint.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedComplaint.status === 'RESOLVED' || selectedComplaint.status === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : selectedComplaint.priority_score >= 85
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {selectedComplaint.status}
              </span>
            </div>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo */}
          {selectedComplaint.image_url && (
            <div className="mt-3 relative h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={selectedComplaint.image_url}
                alt={selectedComplaint.category}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                Priority Score: {selectedComplaint.priority_score}/100
              </div>
            </div>
          )}

          <div className="mt-3">
            <h3 className="text-base font-bold text-white capitalize flex items-center gap-2">
              {selectedComplaint.category.replace('_', ' ')}
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-3">{selectedComplaint.description}</p>
          </div>

          {/* Priority Breakdown Mini-Card */}
          {selectedComplaint.priority_breakdown && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Priority Engine Breakdown
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Severity (40%): <strong className="text-white">{selectedComplaint.priority_breakdown.severity?.value || 88}</strong></div>
                <div>Traffic (25%): <strong className="text-white">{selectedComplaint.priority_breakdown.traffic?.value || 75}</strong></div>
                <div>Reports (20%): <strong className="text-white">{selectedComplaint.nearby_reports_count || 12} reports</strong></div>
                <div>Location (15%): <strong className="text-white">{selectedComplaint.priority_breakdown.location?.value || 85}</strong></div>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-1 text-xs text-slate-300">
            <div><span className="text-slate-400">Address:</span> {selectedComplaint.address}</div>
            <div><span className="text-slate-400">Department:</span> <span className="text-cyan-400 font-semibold">{selectedComplaint.department}</span></div>
            {selectedComplaint.assigned_worker_name && (
              <div><span className="text-slate-400">Worker:</span> {selectedComplaint.assigned_worker_name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
