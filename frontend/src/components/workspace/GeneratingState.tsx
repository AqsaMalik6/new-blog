"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const messages = [
  "Analysing your request...",
  "Researching keywords...",
  "Building SEO strategy...",
  "Optimising for answer engines...",
  "Preparing for AI citation...",
  "Writing your blog...",
  "Validating quality...",
  "Almost there..."
];

export default function GeneratingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Loader2 size={24} className="animate-pulse" />
            </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Generating your blog post</h2>
      <p className="text-muted-foreground animate-pulse transition-all duration-500">
        {messages[index]}
      </p>
      
      <div className="mt-8 flex gap-1">
        {messages.map((_, i) => (
            <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${i === index ? "bg-primary w-6" : "bg-muted"}`}
            ></div>
        ))}
      </div>
    </div>
  );
}
