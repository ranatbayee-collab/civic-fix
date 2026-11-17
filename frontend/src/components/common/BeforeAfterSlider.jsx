import React, { useState } from 'react';

export default function BeforeAfterSlider({ beforeUrl, afterUrl, category }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    if (!x) return;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  };

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden select-none cursor-ew-resize border border-slate-700 bg-slate-950 shadow-inner group"
      onMouseMove={(e) => isDragging && handleMove(e)}
      onTouchMove={(e) => handleMove(e)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onClick={handleMove}
    >
      {/* After Image (Background layer) */}
      <img
        src={afterUrl}
        alt="After repair"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-sm z-10">
        AFTER (RESOLVED)
      </div>

      {/* Before Image (Foreground clipped layer) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeUrl}
          alt="Before repair"
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: '100%', minWidth: '100%' }}
        />
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-rose-950/80 border border-rose-500/40 text-[10px] font-bold text-rose-300 uppercase tracking-wider backdrop-blur-sm z-10">
          BEFORE (REPORTED)
        </div>
      </div>

      {/* Vertical Divider Line & Thumb */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_#00f5ff] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-lg flex items-center justify-center text-cyan-400 text-xs font-bold pointer-events-auto">
          ↔
        </div>
      </div>

      {/* Helper label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-300 pointer-events-none backdrop-blur-sm">
        Drag slider to inspect repair quality
      </div>
    </div>
  );
}
