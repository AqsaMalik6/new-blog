"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-40 pb-20 overflow-hidden bg-[#020617] text-center">
      
      {/* Refined Illumination Beams (Softer & Wider) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Central Soft Glow Source */}
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]"></div>
        
        {/* Wide Soft Beams */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[120%] flex justify-center opacity-30">
           <div className="w-[150px] h-full bg-gradient-to-t from-blue-500/40 via-blue-500/10 to-transparent rotate-[-40deg] origin-bottom blur-[60px]"></div>
           <div className="w-[100px] h-full bg-gradient-to-t from-blue-400/30 via-blue-400/5 to-transparent rotate-[-15deg] origin-bottom blur-[40px] ml-40"></div>
           <div className="w-[150px] h-full bg-gradient-to-t from-blue-600/40 via-blue-600/10 to-transparent rotate-[0deg] origin-bottom blur-[50px]"></div>
           <div className="w-[100px] h-full bg-gradient-to-t from-blue-400/30 via-blue-400/5 to-transparent rotate-[15deg] origin-bottom blur-[40px] mr-40"></div>
           <div className="w-[150px] h-full bg-gradient-to-t from-blue-500/40 via-blue-500/10 to-transparent rotate-[40deg] origin-bottom blur-[60px]"></div>
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center max-w-4xl">
        <div className="animate-slideUp">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-8 leading-tight text-white">
            Write Blogs That Rank on <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Google
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            The only blog generator powered by SEO, AEO, and GEO agents working together to give your content maximum visibility across all search platforms.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:scale-[1.05] hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              Start for Free
            </Link>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/70 hover:text-white transition-colors text-base font-medium flex items-center gap-2 group"
            >
              See How It Works
              <span className="group-hover:translate-y-1 transition-transform">↓</span>
            </button>
          </div>
        </div>

        {/* Dashboard Mockup (Unified Sales Dashboard Look) */}
        <div className="w-full max-w-[800px] bg-[#0d1117] rounded-t-[3rem] border-x border-t border-blue-500/20 shadow-[0_-20px_50px_rgba(37,99,235,0.1)] z-20 flex flex-col p-8 relative overflow-hidden group">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs">⚡</div>
                 <div className="flex flex-col">
                    <div className="h-3 w-24 bg-slate-800 rounded-full mb-1"></div>
                    <div className="h-2 w-16 bg-slate-800/50 rounded-full"></div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
              </div>
           </div>

           <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Ranking Metrics Inside Dashboard */}
              <div className="space-y-6">
                 {[
                   { label: "SEO", score: "98%", width: "w-[98%]", color: "from-blue-500 to-blue-400" },
                   { label: "AEO", score: "94%", width: "w-[94%]", color: "from-cyan-500 to-cyan-400" },
                   { label: "GEO", score: "91%", width: "w-[91%]", color: "from-indigo-500 to-indigo-400" }
                 ].map((item, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-white/50 uppercase">
                         <span>{item.label} Performance</span>
                         <span className="text-blue-400">{item.score}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                         <div className={`absolute inset-0 bg-gradient-to-r ${item.color} ${item.width} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}></div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Visual Indicator */}
              <div className="bg-slate-900/50 rounded-[2rem] border border-blue-500/10 p-6 h-48 flex flex-col items-center justify-center relative overflow-hidden group/card">
                 <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                 <div className="w-20 h-20 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-4 relative z-10"></div>
                 <div className="text-blue-400 text-xs font-bold tracking-widest uppercase relative z-10">Analysing Agents...</div>
                 <div className="mt-2 text-white/30 text-[10px] relative z-10">Real-time optimization active</div>
              </div>
           </div>
           
           {/* Inner Bottom Glow */}
           <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
