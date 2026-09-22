import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DocumentCanvas({ imagePath, imageUrl, lines, selectedLineIndex, setSelectedLineIndex }) {
  const [zoom, setZoom] = useState(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Normalize image URL
  const displayUrl = imageUrl || (imagePath ? `/static/images/${imagePath}` : '/static/images/prescription_0001.png');

  const getBoxColor = (category, isSelected) => {
    if (isSelected) return 'border-cyan-400 bg-cyan-500/30 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40 z-30';

    switch (category) {
      case 'DIAGNOSIS_ICD10':
        return 'border-purple-400/80 bg-purple-500/20 hover:bg-purple-500/35 text-purple-300';
      case 'DRUG_PRESCRIPTION':
        return 'border-pink-400/80 bg-pink-500/20 hover:bg-pink-500/35 text-pink-300';
      case 'FREQUENCY_INSTRUCTION':
        return 'border-amber-400/80 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300';
      case 'PATIENT_INFO':
      case 'HOSPITAL_HEADER':
        return 'border-blue-400/80 bg-blue-500/20 hover:bg-blue-500/35 text-blue-300';
      case 'DOCTOR_SIGNATURE':
        return 'border-emerald-400/80 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300';
      default:
        return 'border-indigo-400/70 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300';
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      {/* Canvas Controls Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200 text-sm font-outfit">Bio-OCR Bounding Box Canvas</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showBoundingBoxes ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Bounding Boxes
          </button>
          
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.75, zoom - 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.6, zoom + 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white ml-1 border-l border-slate-800"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Image & Bounding Box Workspace */}
      <div className="relative flex-1 overflow-auto bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-center min-h-[480px]">
        <div
          className="relative transition-transform duration-200 ease-out shadow-2xl rounded-lg overflow-hidden"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <img
            src={displayUrl}
            alt="Biomedical Prescription Document"
            className="max-w-full h-auto min-w-[550px] object-contain rounded-lg border border-slate-800"
            onError={(e) => {
              // Fallback placeholder image renderer if server image URL is loading
              e.target.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80';
            }}
          />

          {/* Bounding Box Overlays */}
          {showBoundingBoxes && lines && lines.map((line, idx) => {
            const bbox = line.bbox || [40, 40 + idx * 35, 500, 24];
            const isSelected = selectedLineIndex === idx;
            const colorClasses = getBoxColor(line.category, isSelected);

            return (
              <div
                key={idx}
                onClick={() => setSelectedLineIndex(idx)}
                className={`absolute border-2 rounded transition-all duration-150 cursor-pointer ${colorClasses}`}
                style={{
                  left: `${bbox[0]}px`,
                  top: `${bbox[1]}px`,
                  width: `${bbox[2]}px`,
                  height: `${bbox[3] || 24}px`
                }}
                title={`Line ${idx + 1}: ${line.category} | ${line.corrected_text || line.raw_text}`}
              >
                <span className="absolute -top-3 -left-1 text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900/90 text-slate-200 border border-slate-700 shadow">
                  L{idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
        <span className="text-slate-400 font-medium">Entity Legend:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> ICD-10 & Diagnosis
          </span>
          <span className="flex items-center gap-1.5 text-pink-300">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Drug & Medication
          </span>
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Header & Patient
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Doctor Signature
          </span>
        </div>
      </div>
    </div>
  );
}
