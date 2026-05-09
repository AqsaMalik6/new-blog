"use client";
import { useState } from "react";
import { BlogListItem } from "@/types/blog";
import { useRouter } from "next/navigation";
import { analyzeGEO, GEOAnalysis } from "@/lib/geoScore";
import { blogAPI } from "@/lib/api";
import GEOInsightModal from "./GEOInsightModal";

interface Props {
  blog: BlogListItem & { content?: string; keyword_targets?: string[] };
}

export default function BlogCard({ blog }: Props) {
  const router = useRouter();
  const [showGEO, setShowGEO] = useState(false);
  const [geoAnalysis, setGeoAnalysis] = useState<GEOAnalysis | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Calculate GEO analysis (only when modal is opened)
  const handleGEOClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    
    if (geoAnalysis) { 
        setShowGEO(true); 
        return; 
    }

    setGeoLoading(true);
    try {
        const fullBlog = await blogAPI.getById(blog.id);
        const analysis = analyzeGEO(
            fullBlog.content, 
            fullBlog.title, 
            fullBlog.keyword_targets || []
        );
        setGeoAnalysis(analysis);
        setShowGEO(true);
    } catch (err) {
        console.error("GEO analysis failed", err);
    } finally {
        setGeoLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <div
        className="relative group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 overflow-hidden"
        onClick={() => router.push(`/workspace/blogs/${blog.id}`)}
      >
        {/* Image Area — top 55% of card */}
        <div className="relative w-full h-[180px] overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          {blog.image_url ? (
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it and show gradient fallback
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add("show-fallback");
                }
              }}
            />
          ) : null}
          {/* Fallback letter — always rendered behind image, visible when image fails */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-white/10 select-none">
              {blog.title.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 pb-14">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
            {blog.title}
          </h3>
          {blog.meta_description && (
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
              {blog.meta_description}
            </p>
          )}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>{new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span>{blog.word_count?.toLocaleString() || "—"} words</span>
          </div>
        </div>

        {/* GEO Insight Button — bottom right, always visible */}
        <button
          onClick={handleGEOClick}
          disabled={geoLoading}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-semibold transition-all duration-200 z-10 disabled:opacity-50"
        >
          <span>{geoLoading ? "..." : "⚡"}</span>
          <span>{geoLoading ? "Analysing..." : "GEO Insight"}</span>
        </button>
      </div>

      {/* GEO Modal */}
      {showGEO && geoAnalysis && (
        <GEOInsightModal
          analysis={geoAnalysis}
          onClose={() => setShowGEO(false)}
        />
      )}
    </>
  );
}
