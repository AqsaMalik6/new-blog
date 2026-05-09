"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useBlogs } from "@/hooks/useBlogs";
import { Blog } from "@/types/blog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, ExternalLink, Tag, Loader2, Trash2 } from "lucide-react";

export default function BlogDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getBlog, deleteBlog } = useBlogs();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getBlog(id as string);
        setBlog(data);
      } catch (err) {
        router.push("/workspace/blogs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlog();
  }, [id, getBlog, router]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this blog?")) {
      await deleteBlog(id as string);
      router.push("/workspace/blogs");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 flex flex-col items-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your blog...</p>
      </div>
    );
  }

  if (!blog) return null;

  const date = new Date(blog.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="container mx-auto px-4 max-w-4xl py-12 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <Link 
            href="/workspace/blogs"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Blogs
        </Link>
        <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
            title="Delete Blog"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Header Image */}
      <div className="relative w-full h-[400px] md:h-[350px] sm:h-[220px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 mb-8">
        {blog.image_url && (
          <img
            src={blog.image_url}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
        {blog.title}
      </h1>

      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-10 pb-10 border-b border-border">
        <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> {date}
        </div>
        <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" /> {blog.word_count.toLocaleString()} words
        </div>
        {blog.source_url && (
            <a 
                href={blog.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
                <ExternalLink size={16} /> Source URL
            </a>
        )}
      </div>

      <div className="bg-card/50 border border-border p-6 rounded-2xl mb-12 italic text-muted-foreground leading-relaxed">
        <span className="font-bold text-foreground block mb-1 not-italic">Meta Description:</span>
        {blog.meta_description}
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {blog.keyword_targets.map((keyword, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs font-semibold text-muted-foreground border border-border">
                <Tag size={12} className="text-primary" /> {keyword}
            </div>
        ))}
      </div>

      <div className="
        prose prose-invert max-w-none
        prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white prose-h1:mt-8 prose-h1:mb-4
        prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-10 prose-h2:mb-4
        prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-2
        prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-200 prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-slate-300 prose-p:leading-[1.85] prose-p:text-[17px] prose-p:mb-4
        prose-strong:text-white prose-strong:font-bold
        prose-ul:text-slate-300 prose-ul:space-y-2
        prose-ol:text-slate-300 prose-ol:space-y-2
        prose-li:text-slate-300
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
        prose-hr:border-slate-700
        prose-a:text-blue-500 prose-a:font-bold prose-a:underline hover:prose-a:text-blue-400
        prose-strong:text-white prose-strong:font-bold
        [&_strong]:text-xl [&_strong]:text-white [&_strong]:mt-6 [&_strong]:inline-block
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {blog.content}
        </ReactMarkdown>
      </div>
      
      <div className="mt-20 pt-10 border-t border-border flex flex-col items-center text-center">
         <p className="text-muted-foreground mb-4 italic">Need another version of this content?</p>
         <Link 
            href="/workspace"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform"
         >
            Generate Another Blog
         </Link>
      </div>
    </div>
  );
}
