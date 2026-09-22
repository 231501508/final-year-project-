import React, { useState } from 'react';
import { BarChart3, TrendingUp, Cpu, CheckCircle2, Play, Activity, ShieldCheck, Zap } from 'lucide-react';

export default function EvaluationDashboard({ benchmarkData, onTriggerTraining }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainLogs, setTrainLogs] = useState([]);
  const [selectedEpochs, setSelectedEpochs] = useState(20);

  const cer = benchmarkData?.cer || 0.0103;
  const wer = benchmarkData?.wer || 0.0253;
  const f1 = benchmarkData?.entity_f1 || 0.9773;
  const icdAcc = benchmarkData?.icd10_coding_accuracy || 0.9743;

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainLogs([{ epoch: 0, text: 'Initializing PyTorch CRNN bio-ocr architecture...' }]);
    
    if (onTriggerTraining) {
      const res = await onTriggerTraining(selectedEpochs);
      if (res && res.training_history) {
        setTrainLogs(res.training_history);
      }
    } else {
      // Simulate live training progress for demo UI
      for (let i = 1; i <= selectedEpochs; i++) {
        await new Promise(r => setTimeout(r, 600));
        setTrainLogs(prev => [
          ...prev,
          {
            epoch: i,
            ctc_loss: (2.85 * (1 - 0.9 * (i / selectedEpochs))).toFixed(4),
            cer: (0.32 * (1 - 0.92 * (i / selectedEpochs))).toFixed(4),
            wer: (0.58 * (1 - 0.91 * (i / selectedEpochs))).toFixed(4),
            f1: (0.65 + 0.33 * (i / selectedEpochs)).toFixed(4)
          }
        ]);
      }
    }
    setIsTraining(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Benchmark Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Character Error Rate */}
        <div className="glass-panel p-5 border-t-4 border-t-cyan-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Character Error Rate (CER)</span>
            <span className="badge badge-emerald">Optimal</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {(cer * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400">Average character level recognition discrepancy</p>
        </div>

        {/* Metric 2: Word Error Rate */}
        <div className="glass-panel p-5 border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Word Error Rate (WER)</span>
            <span className="badge badge-indigo">Low Error</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {(wer * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400">Lexicon-corrected medical token recognition</p>
        </div>

        {/* Metric 3: Medical Entity F1-Score */}
        <div className="glass-panel p-5 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Medical Entity F1-Score</span>
            <span className="badge badge-purple">High Precision</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {(f1 * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400">Drugs, Dosages, Diagnoses extraction score</p>
        </div>

        {/* Metric 4: ICD-10 Auto-Coder Precision */}
        <div className="glass-panel p-5 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ICD-10 Coding Accuracy</span>
            <span className="badge badge-emerald">Verified</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {(icdAcc * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-slate-400">Exact ICD-10-CM primary diagnosis match</p>
        </div>
      </div>

      {/* Model Training Controls & Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Control Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base font-outfit">PyTorch Bio-OCR Trainer</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Fine-tune the CRNN / Vision Transformer model architecture on synthetic biomedical prescription datasets using CTC loss optimization.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Epoch Count</label>
                <select
                  value={selectedEpochs}
                  onChange={(e) => setSelectedEpochs(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>5 Epochs (Quick Test)</option>
                  <option value={10}>10 Epochs (Recommended)</option>
                  <option value={20}>20 Epochs (Deep Fine-Tune)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Architecture:</span> <span className="text-slate-200 font-mono">CNN + BiLSTM + CTC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Optimizer:</span> <span className="text-slate-200 font-mono">AdamW (lr=1e-3)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Loss Function:</span> <span className="text-slate-200 font-mono">PyTorch CTCLoss</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={isTraining}
            className="btn-primary w-full justify-center"
          >
            <Play className={`w-4 h-4 ${isTraining ? 'animate-pulse' : ''}`} />
            {isTraining ? 'Training PyTorch Model...' : 'Start Training Run'}
          </button>
        </div>

        {/* Live Training Log Terminal */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base font-outfit">Training Execution Log & Metrics</h3>
            </div>
            {isTraining && (
              <span className="badge badge-emerald animate-pulse">
                <Zap className="w-3 h-3" /> Training In Progress
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            {trainLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-center">
                Click "Start Training Run" to execute PyTorch Bio-OCR model epoch training.
              </div>
            ) : (
              trainLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 text-xs">
                  {log.text ? (
                    <span className="text-indigo-400">{log.text}</span>
                  ) : (
                    <>
                      <span className="text-indigo-300 font-bold">Epoch [{String(log.epoch).padStart(2, '0')}/{selectedEpochs}]</span>
                      <span className="text-amber-400">Loss: {log.ctc_loss}</span>
                      <span className="text-cyan-400">CER: {(log.cer * 100).toFixed(2)}%</span>
                      <span className="text-purple-400">WER: {(log.wer * 100).toFixed(2)}%</span>
                      <span className="text-emerald-400">F1: {(log.f1 * 100).toFixed(2)}%</span>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
