"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBlogs } from "@/hooks/useBlogs";
import ChatInput from "@/components/workspace/ChatInput";
import GeneratingState from "@/components/workspace/GeneratingState";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const suggestions = [
  "Write about our new product line",
  "Generate a blog from a product URL",
  "SEO strategy for a SaaS platform"
];

export default function WorkspacePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlogId, setGeneratedBlogId] = useState<string | null>(null);
  const { generateBlog } = useBlogs();
  const router = useRouter();

  const handleSend = async (query: string, url?: string) => {
    setIsGenerating(true);
    setGeneratedBlogId(null);
    try {
      const blog = await generateBlog({ query, source_url: url });
      setGeneratedBlogId(blog.id);
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        {isGenerating ? (
          <GeneratingState />
        ) : generatedBlogId ? (
          <div className="text-center animate-fadeIn max-w-md">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Blog generated successfully!</h2>
            <p className="text-muted-foreground mb-8">
                Your content is ready. It has been optimised for SEO, AEO, and GEO.
            </p>
            <button
              onClick={() => router.push(`/workspace/blogs/${generatedBlogId}`)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold mx-auto hover:opacity-90 transition-all"
            >
              View Blog <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div className="max-w-2xl w-full animate-slideUp text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-primary">
                <Sparkles size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">What would you like to write about today?</h1>
            <p className="text-muted-foreground text-lg mb-10">
                Enter a topic or paste a URL to start the multi-agent generation pipeline.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="p-4 rounded-xl border border-border bg-card/50 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-left flex flex-col justify-between h-28"
                >
                  <span className="text-primary"><ArrowRight size={16} /></span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isGenerating} />
    </div>
  );
}
