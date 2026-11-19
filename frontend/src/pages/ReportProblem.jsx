import React, { useState } from 'react';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import {
  Camera,
  Upload,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Info
} from 'lucide-react';

const SAMPLE_CIVIC_PHOTOS = [
  {
    category: 'pothole',
    label: '🕳️ Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
    desc: 'Deep asphalt crater spanning 1.5 meters on main carriageway.'
  },
  {
    category: 'garbage',
    label: '🗑️ Garbage',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800',
    desc: 'Overflowing refuse dumpster spilling onto pedestrian sidewalk.'
  },
  {
    category: 'streetlight',
    label: '💡 Streetlight',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
    desc: 'Damaged luminaire pole causing dark hazard at busy junction.'
  },
  {
    category: 'water_leak',
    label: '💧 Water Leak',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800',
    desc: 'Underground drinking water main pipeline breach flooding road.'
  },
  {
    category: 'drainage',
    label: '🚰 Drainage',
    url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800',
    desc: 'Heavily clogged stormwater culvert overflowing with sediment.'
  },
  {
    category: 'fallen_tree',
    label: '🌳 Fallen Tree',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    desc: 'Storm damage snapped large banyan tree blocking 2 traffic lanes.'
  },
  {
    category: 'traffic_signal',
    label: '🚦 Traffic Signal',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800',
    desc: 'Traffic light malfunctioning stuck on blinking amber at crossroad.'
  }
];

export default function ReportProblem({ onReportSubmitted, onViewReports }) {
  const { showToast } = useNotifications();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(SAMPLE_CIVIC_PHOTOS[0].url);
  const [description, setDescription] = useState(SAMPLE_CIVIC_PHOTOS[0].desc);
  const [selectedSampleCat, setSelectedSampleCat] = useState('pothole');

  // GPS coordinates from environment config with fallback
  const defaultLat = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '20.2961');
  const defaultLng = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '85.8245');

  const [latitude, setLatitude] = useState(defaultLat);
  const [longitude, setLongitude] = useState(defaultLng);
  const [address, setAddress] = useState('Near College Road, Jayadev Vihar, Bhubaneswar');
  const [gpsLoading, setGpsLoading] = useState(false);

  // AI Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [aiDetection, setAiDetection] = useState({
    category: 'pothole',
    confidence: 0.94,
    severity: 'HIGH',
    severity_score: 90,
    bounding_boxes: [{ label: 'pothole_crater', confidence: 0.94, box: [0.35, 0.22, 0.78, 0.81] }]
  });

  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Handle sample selection
  const handleSelectSample = (sample) => {
    setSelectedSampleCat(sample.category);
    setImageFile(null);
    setImagePreview(sample.url);
    setDescription(sample.desc);
    runAiScan(sample.url, sample.desc, sample.category);
  };

  // Handle local file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      runAiScan(url, description, null, file);
    }
  };

  // Run AI Scanner
  const runAiScan = async (url, desc, catHint, fileObj = null) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      if (fileObj) {
        formData.append('image', fileObj);
      } else {
        formData.append('image_url', url);
      }
      formData.append('description', desc);
      if (catHint) formData.append('category_hint', catHint);

      const res = await api.scanImage(formData);
      if (res && res.detection) {
        setAiDetection(res.detection);
      }
    } catch (err) {
      console.warn('AI scan fallback:', err);
    } finally {
      setTimeout(() => setIsScanning(false), 900);
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'WARNING');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode via environment configured endpoint
        const nominatimBase = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/reverse';
        try {
          const res = await fetch(`${nominatimBase}?format=json&lat=${lat}&lon=${lng}`)
            .then((r) => r.json())
            .catch(() => null);

          if (res && res.display_name) {
            setAddress(res.display_name.split(',').slice(0, 3).join(', '));
          } else {
            setAddress(`Sector ${Math.floor(lat % 10)}, Metro Area (${lat}, ${lng})`);
          }
        } catch (e) {
          setAddress(`GPS Location (${lat}, ${lng})`);
        }

        setGpsLoading(false);
        showToast('📍 GPS coordinates captured successfully!', 'SUCCESS');
      },
      (error) => {
        setGpsLoading(false);
        showToast(`Could not obtain GPS (${error.message}). Using city reference coordinates.`, 'INFO');
      },
      { timeout: 8000 }
    );
  };

  // Final Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter a description of the problem.', 'WARNING');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('image_url', imagePreview);
      }
      formData.append('description', description);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('category_hint', aiDetection.category);
      if (isEmergency) formData.append('is_emergency', 'true');

      const res = await api.createComplaint(formData);
      setSubmittedComplaint(res.complaint);
      showToast(`Complaint #${res.complaint.id} created and AI-verified!`, 'SUCCESS');
      if (onReportSubmitted) onReportSubmitted(res.complaint);
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculated preview score
  const sevScore = aiDetection.severity_score || 85;
  const trafScore = aiDetection.severity === 'CRITICAL' || isEmergency ? 95 : 75;
  const repScore = 70;
  const locScore = isEmergency ? 98 : 85;
  const calcScore = isEmergency
    ? 98
    : Math.round(sevScore * 0.4 + trafScore * 0.25 + repScore * 0.2 + locScore * 0.15);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Title */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Autonomous AI Civic Intake
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Report a Civic Problem
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Capture photo → AI automatically detects defect, scores severity, and dispatches municipal crews.
        </p>
      </div>

      {/* Success Modal if complaint submitted */}
      {submittedComplaint && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-500/50 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-lg font-black text-white">Complaint Registered!</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                  #{submittedComplaint.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Your report has been analyzed by AI and auto-routed to{' '}
                <strong className="text-cyan-300">{submittedComplaint.department}</strong> with a Priority Score of{' '}
                <strong className="text-emerald-400">{submittedComplaint.priority_score}/100</strong>.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSubmittedComplaint(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Report Another
              </button>
              <button
                onClick={() => onViewReports && onViewReports()}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Track Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual AI Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  1. Capture / Select Photo
                </span>
              </div>
              <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo & Scanner Viewport */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group">
              <img
                src={imagePreview}
                alt="Civic issue"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Laser Scan Animation Line */}
              {isScanning && <div className="scanner-laser" />}

              {/* Bounding Box HUD Overlay */}
              {!isScanning && aiDetection.bounding_boxes && aiDetection.bounding_boxes[0] && (
                <div
                  className="absolute border-2 border-cyan-400 bg-cyan-400/10 rounded pointer-events-none transition-all duration-300"
                  style={{
                    top: `${aiDetection.bounding_boxes[0].box[0] * 100}%`,
                    left: `${aiDetection.bounding_boxes[0].box[1] * 100}%`,
                    height: `${(aiDetection.bounding_boxes[0].box[2] - aiDetection.bounding_boxes[0].box[0]) * 100}%`,
                    width: `${(aiDetection.bounding_boxes[0].box[3] - aiDetection.bounding_boxes[0].box[1]) * 100}%`
                  }}
                >
                  <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 shadow-md">
                    <span>{aiDetection.category}</span>
                    <span>{((aiDetection.confidence || 0.94) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Scan Status Badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs text-white flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'}`} />
                <span className="font-mono text-[11px]">
                  {isScanning ? 'AI Computer Vision Processing...' : `YOLOv8: ${aiDetection.category.toUpperCase()} (${((aiDetection.confidence || 0.94) * 100).toFixed(0)}%)`}
                </span>
              </div>
            </div>

            {/* Quick Preset Selector for instant testing */}
            <div className="mt-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Or pick a realistic demo problem:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_CIVIC_PHOTOS.map((sample) => (
                  <button
                    key={sample.category}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs ${
                      selectedSampleCat === sample.category
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold truncate">{sample.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Detection Insight Card */}
          <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Classification Diagnostics
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Detected Class</div>
                <div className="font-bold text-white capitalize mt-0.5">{aiDetection.category.replace('_', ' ')}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">AI Confidence</div>
                <div className="font-bold text-cyan-300 font-mono mt-0.5">{((aiDetection.confidence || 0.94) * 100).toFixed(0)}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Damage Severity</div>
                <div className={`font-bold mt-0.5 ${aiDetection.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {aiDetection.severity || 'HIGH'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Location, Priority & Submit (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Location Capture */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  2. GPS Location
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MapPin className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-bounce' : ''}`} />
                <span>{gpsLoading ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Reverse Geocoded Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                Lat: <span className="text-slate-200">{latitude}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                Lng: <span className="text-slate-200">{longitude}</span>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              3. Describe Problem
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Deep pothole causing two-wheelers to slip near college road..."
              className="w-full p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />

            {/* Emergency Mode Toggle */}
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-bold text-rose-300">Emergency Corridor Mode</div>
                  <div className="text-[10px] text-slate-400">Hospital road / Severe safety hazard</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Live Priority Score Widget */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estimated Priority Score
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider ${
                  calcScore >= 85
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : calcScore >= 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {calcScore}/100 {calcScore >= 85 ? '🔴 CRITICAL' : calcScore >= 70 ? '🟠 HIGH' : '🟡 MEDIUM'}
              </span>
            </div>

            {/* Formula breakdown bar */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Severity (40%):</span>
                <span className="font-mono text-cyan-300">{sevScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Level (25%):</span>
                <span className="font-mono text-cyan-300">{trafScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Nearby Reports (20%):</span>
                <span className="font-mono text-cyan-300">{repScore} (12 reports)</span>
              </div>
              <div className="flex justify-between">
                <span>Location Importance (15%):</span>
                <span className="font-mono text-cyan-300">{locScore}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>AI Analyzing & Registering...</span>
                </>
              ) : (
                <>
                  <span>SUBMIT CIVIC REPORT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
