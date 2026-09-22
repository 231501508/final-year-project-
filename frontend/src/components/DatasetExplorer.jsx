import React, { useState } from 'react';
import { Database, Download, RefreshCw, Eye, FileJson, Sparkles, Filter, Search, Tag } from 'lucide-react';

export default function DatasetExplorer({ datasetSamples, onSelectSample, onGenerateDataset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  const docs = datasetSamples?.documents || [];

  // Filter documents
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.diagnoses.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          doc.icd10_codes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterCategory === 'ALL') return matchesSearch;
    if (filterCategory === 'DIABETES') return matchesSearch && doc.icd10_codes.some(c => c.includes('E11'));
    if (filterCategory === 'HYPERTENSION') return matchesSearch && doc.icd10_codes.some(c => c.includes('I10'));
    if (filterCategory === 'ASTHMA') return matchesSearch && doc.icd10_codes.some(c => c.includes('J45'));
    return matchesSearch;
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    if (onGenerateDataset) {
      await onGenerateDataset(15);
    }
    setIsGenerating(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(docs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "bio_ocr_medical_dataset.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Dataset Overview Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white font-outfit">Biomedical OCR Synthetic Dataset</h2>
            <span className="badge badge-indigo">{docs.length} Annotated Documents</span>
          </div>
          <p className="text-xs text-slate-400">
            Synthetically rendered prescription and report documents with bounding box annotations, clinical entity tags, and ICD-10 ground truths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate New Samples'}
          </button>

          <button
            onClick={handleExportJSON}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by patient, doctor, diagnosis, or ICD-10 code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'DIABETES', 'HYPERTENSION', 'ASTHMA'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Conditions' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc, idx) => (
          <div
            key={idx}
            className="glass-panel p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all cursor-pointer group"
            onClick={() => setSelectedDoc(doc)}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {doc.doc_id}
                </span>
                <div className="flex gap-1">
                  {doc.icd10_codes.map((code, cIdx) => (
                    <span key={cIdx} className="badge badge-purple text-[10px] font-mono">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Document Preview Thumbnail */}
              <div className="w-full h-36 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 mb-3 relative group-hover:border-slate-700">
                <img
                  src={doc.image_url || `/static/images/${doc.image_file}`}
                  alt={doc.doc_id}
                  className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <span className="absolute bottom-2 left-2 text-[10px] text-slate-300 font-medium">
                  {doc.annotations?.length || 8} Bounding Boxes
                </span>
              </div>

              <h4 className="font-semibold text-slate-200 text-sm">{doc.patient}</h4>
              <p className="text-xs text-slate-400 mb-2">{doc.doctor}</p>

              <div className="flex flex-wrap gap-1 mb-2">
                {doc.diagnoses.map((diag, dIdx) => (
                  <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {diag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSample(doc);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Scan in OCR Studio
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDoc(doc);
                }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px]"
              >
                <FileJson className="w-3.5 h-3.5" /> JSON
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* JSON Modal Viewer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base font-outfit">Document Annotation JSON - {selectedDoc.doc_id}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 bg-slate-800 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(selectedDoc, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
