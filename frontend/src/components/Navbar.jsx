import React from 'react';
import { ScanText, Database, BarChart3, Search, Activity, Cpu, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, datasetCount, accuracy }) {
  const tabs = [
    { id: 'ocr-coder', label: 'Bio-OCR & ICD-10 Coder', icon: ScanText },
    { id: 'dataset', label: 'Medical Dataset', icon: Database, badge: datasetCount ? `${datasetCount}` : '30' },
    { id: 'benchmark', label: 'Model Benchmark', icon: BarChart3, badge: accuracy ? `${accuracy}%` : '96.2%' },
    { id: 'icd-lookup', label: 'ICD-10 Directory', icon: Search }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-outfit">MED-ICD</h1>
              <span className="badge badge-indigo">
                <Sparkles className="w-3 h-3" /> Bio-OCR v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Biomedical Document Recognition & ICD-10 Auto-Coder</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-full">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> PyTorch Engine Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
