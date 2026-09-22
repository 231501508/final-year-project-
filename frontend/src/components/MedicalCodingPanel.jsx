import React from 'react';
import { Award, Pill, FileCode2, CheckCircle, AlertTriangle, ShieldCheck, Sparkles, Stethoscope, ChevronRight } from 'lucide-react';

export default function MedicalCodingPanel({ codingData, lines }) {
  if (!codingData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <Stethoscope className="w-12 h-12 text-slate-600 mb-3 animate-bounce" />
        <h4 className="text-slate-300 font-semibold font-outfit text-base">Awaiting Document Analysis</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">Upload a prescription image or select a sample to perform Bio-OCR and automated ICD-10 medical coding.</p>
      </div>
    );
  }

  const primaryCode = codingData.primary_diagnosis_code;
  const secondaryCodes = codingData.secondary_diagnosis_codes || [];
  const medications = codingData.medications_detected || [];
  const cptProcedures = codingData.cpt_procedures || [];

  // Extract corrections made by bio-lexicon
  const lexiconCorrections = [];
  lines?.forEach(line => {
    if (line.corrections && line.corrections.length > 0) {
      lexiconCorrections.push(...line.corrections);
    }
  });

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Primary ICD-10 Diagnosis Card */}
      <div className="glass-panel glass-panel-glow p-5 border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm font-outfit tracking-wide uppercase">Primary ICD-10-CM Diagnosis</h3>
          </div>
          {primaryCode && (
            <span className="badge badge-emerald">
              <CheckCircle className="w-3 h-3" /> {(primaryCode.confidence * 100).toFixed(0)}% Match Confidence
            </span>
          )}
        </div>

        {primaryCode ? (
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-sm font-bold border border-indigo-500/40 mb-1">
                  ICD-10-CM: {primaryCode.icd10_code}
                </span>
                <h4 className="text-base font-semibold text-slate-100">{primaryCode.description}</h4>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">{primaryCode.category}</p>

            {/* Confidence Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Clinical Confidence Score</span>
                <span className="font-mono text-emerald-400">{(primaryCode.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${primaryCode.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Triggers Breakdown */}
            {primaryCode.triggers && primaryCode.triggers.length > 0 && (
              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium block mb-1">Rationale Triggers:</span>
                <ul className="space-y-1">
                  {primaryCode.triggers.map((trig, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-300">
                      <ChevronRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                      <span>{trig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No primary diagnosis code matched with high confidence.</p>
        )}
      </div>

      {/* Secondary Diagnoses */}
      {secondaryCodes.length > 0 && (
        <div className="glass-panel p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-outfit">Secondary ICD-10 Diagnoses</h4>
          <div className="space-y-2">
            {secondaryCodes.map((sec, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="font-mono text-purple-400 font-bold mr-2">{sec.icd10_code}</span>
                  <span className="text-slate-200">{sec.description}</span>
                </div>
                <span className="badge badge-purple">{(sec.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Medications Table */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-pink-400" />
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-outfit">RxNorm Medications ({medications.length})</h4>
          </div>
        </div>

        {medications.length > 0 ? (
          <div className="space-y-2">
            {medications.map((med, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pink-300">{med.medication_name}</span>
                    <span className="text-[10px] text-slate-400">({med.brand_name})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Dosage: {med.dosage} • {med.frequency}</span>
                </div>
                <span className="badge badge-pink">{med.category}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No prescription medications detected.</p>
        )}
      </div>

      {/* CPT Procedures & Billing Guidelines */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-outfit">CPT Procedure Codes</h4>
          </div>
        </div>

        {cptProcedures.length > 0 ? (
          <div className="space-y-2 mb-3">
            {cptProcedures.map((cpt, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono text-cyan-400 font-bold mr-2">CPT: {cpt.cpt_code}</span>
                  <span className="text-slate-300">{cpt.description}</span>
                </div>
                <span className="badge badge-indigo">Matched</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-3">Standard Outpatient Consultation CPT 99213 auto-assigned.</p>
        )}

        {/* Bio-Lexicon Fuzzy Correction Audit Log */}
        {lexiconCorrections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Bio-Lexicon OCR Auto-Corrections ({lexiconCorrections.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lexiconCorrections.map((corr, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                  <span className="line-through text-slate-500 mr-1">{corr.original}</span>
                  <span className="text-emerald-400 font-semibold">{corr.corrected}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
