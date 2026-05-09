"use client";

import Link from "next/link";
import Image from "next/image";
import { BlogListItem } from "@/types/blog";
import { Calendar, Clock } from "lucide-react";

interface BlogCardProps {
  blog: BlogListItem;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const date = new Date(blog.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <Link 
      href={`/workspace/blogs/${blog.id}`}
      className="group block bg-card border border-border/50 rounded-3xl overflow-hidden hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="relative h-48 w-full bg-muted overflow-hidden">
        {blog.image_url ? (
          <Image
            src={blog.image_url}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center p-6">
            <span className="text-xl font-bold text-center opacity-50">{blog.title}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-border">
          <Clock size={12} /> {blog.word_count.toLocaleString()} words
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
          <Calendar size={14} />
          {date}
        </div>
        <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {blog.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
          {blog.meta_description}
        </p>
      </div>
    </Link>
  );
}
