"use client";
import { GEOAnalysis } from "@/lib/geoScore";
import { X } from "lucide-react";

interface Props {
  analysis: GEOAnalysis;
  onClose: () => void;
}

export default function GEOInsightModal({ analysis, onClose }: Props) {
  const progressPercent = (score: number, max: number) => Math.round((score / max) * 100);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-slate-900/80 backdrop-blur-md px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">⚡</div>
              <div>
                <h2 className="text-white font-bold text-lg tracking-wide">Neural GEO Insight</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest">Advanced 9-Cluster Retrieval Analytics</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Citability Index + Context Weight */}
          <div className="flex gap-6 items-start">
            <div className="text-center min-w-[100px]">
              <div className="text-6xl font-black text-purple-400">{analysis.citabilityIndex}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Citability Index</div>
            </div>
            <div className="flex-1">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
                style={{ backgroundColor: analysis.contextWeightColor + "22", color: analysis.contextWeightColor }}
              >
                {analysis.contextWeight} Contextual Weight
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full mb-3">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${analysis.citabilityIndex}%`, backgroundColor: analysis.contextWeightColor }}
                />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{analysis.contextWeightNote}</p>
            </div>
          </div>

          {/* Cluster Grid */}
          <div>
            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>⚡</span> Semantic Cluster Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.clusters.map((cluster) => (
                <div key={cluster.name} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cluster.icon}</span>
                      <span className="text-slate-200 text-sm font-semibold">{cluster.name}</span>
                    </div>
                    <span className="text-green-400 text-sm font-bold">{cluster.score}/{cluster.maxScore}</span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mb-2">
                    <div
                      className="h-1.5 rounded-full bg-green-400 transition-all duration-500"
                      style={{ width: `${progressPercent(cluster.score, cluster.maxScore)}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{cluster.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Roadmap */}
          {analysis.optimizationRoadmap.length > 0 && (
            <div>
              <h3 className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🎯</span> Optimization Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.optimizationRoadmap.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrieval Intent Anchors */}
          {analysis.retrievalIntentAnchors.length > 0 && (
            <div>
              <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🔍</span> Retrieval Intent Anchors
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.retrievalIntentAnchors.map((anchor, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs rounded-lg font-medium"
                  >
                    {anchor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
