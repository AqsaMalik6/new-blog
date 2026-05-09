"use client";

import { useEffect } from "react";
import { useBlogs } from "@/hooks/useBlogs";
import BlogCard from "@/components/workspace/BlogCard";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";

export default function BlogHistoryPage() {
  const { blogs, isLoading, fetchBlogs } = useBlogs();

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Generated Blogs</h1>
          <p className="text-muted-foreground italic">Click any blog to read or manage the full version.</p>
        </div>
        <Link 
            href="/workspace"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> New Blog
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border/50 rounded-3xl h-[320px] animate-pulse"></div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-24 bg-card/50 rounded-3xl border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 size={32} className="text-muted-foreground opacity-20" />
          </div>
          <h3 className="text-xl font-bold mb-2">No blogs yet</h3>
          <p className="text-muted-foreground mb-8">Go generate your first AI-powered content asset.</p>
          <Link 
            href="/workspace"
            className="bg-muted text-foreground px-8 py-3 rounded-xl font-bold text-sm hover:bg-muted/80 transition-all inline-block"
          >
            Go to Workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
