import React, { useState } from 'react';
import { Search, BookOpen, ShieldAlert, CheckCircle, Stethoscope, Pill } from 'lucide-react';
import db from '../../../dataset/icd10_database.json';

export default function ICD10Search() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const icdCodes = db.icd10_codes || [];

  const filteredCodes = icdCodes.filter(icd => {
    const matchesSearch = icd.code.toLowerCase().includes(query.toLowerCase()) ||
                          icd.description.toLowerCase().includes(query.toLowerCase()) ||
                          icd.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()));
    
    if (selectedCategory === 'ALL') return matchesSearch;
    return matchesSearch && icd.category.includes(selectedCategory);
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white font-outfit">ICD-10-CM Medical Code Directory</h2>
            <span className="badge badge-purple">{icdCodes.length} Standard Codes</span>
          </div>
          <p className="text-xs text-slate-400">
            Searchable medical database with clinical descriptions, associated RxNorm medications, and billing guidelines.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search code (e.g., E11.9, I10, Asthma)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Code Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCodes.map((icd, idx) => (
          <div key={idx} className="glass-panel p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-sm font-bold border border-indigo-500/40">
                  {icd.code}
                </span>
                <span className="badge badge-emerald">
                  Risk: {icd.billing_risk}
                </span>
              </div>

              <h3 className="font-semibold text-white text-base mb-1 font-outfit">{icd.description}</h3>
              <p className="text-xs text-slate-400 mb-3">{icd.category}</p>

              {/* Keywords */}
              <div className="mb-3">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">Clinical Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {icd.keywords.map((kw, kIdx) => (
                    <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Common Medications */}
              {icd.common_medications && (
                <div className="mb-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1 font-medium">
                    <Pill className="w-3 h-3 text-pink-400" /> Correlated Medications:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {icd.common_medications.map((med, mIdx) => (
                      <span key={mIdx} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-300">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Billing Guideline */}
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg">
              <span className="font-semibold text-slate-300 block mb-0.5">Coding Guideline:</span>
              {icd.guidelines}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
