"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-slideUp">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Write Blogs That Rank on <span className="text-primary">Google, Answer Engines & AI Tools</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            The only blog generator powered by SEO, AEO, and GEO agents working together to give your content maximum visibility across all search platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-bold text-center hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Start for Free
            </Link>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-muted text-foreground px-8 py-4 rounded-xl text-lg font-bold text-center hover:bg-muted/80 transition-colors"
            >
              See How It Works
            </button>
          </div>
        </div>

        <div className="hidden lg:block relative h-[500px] animate-fadeIn">
          <div className="absolute inset-0 bg-primary/10 rounded-3xl border border-primary/20 backdrop-blur-3xl overflow-hidden p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            <div className="space-y-4">
              <div className="h-4 w-1/2 bg-muted rounded-full animate-pulse"></div>
              <div className="h-4 w-full bg-muted rounded-full animate-pulse [animation-delay:200ms]"></div>
              <div className="h-4 w-3/4 bg-muted rounded-full animate-pulse [animation-delay:400ms]"></div>
            </div>

            <div className="mt-auto space-y-3">
               <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 animate-slideUp [animation-delay:1000ms]">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">SEO</div>
                  <div className="text-xs font-medium">Optimising heading hierarchy...</div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 animate-slideUp [animation-delay:2000ms]">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">AEO</div>
                  <div className="text-xs font-medium">Generating FAQ schema sections...</div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/20 animate-slideUp [animation-delay:3000ms]">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">GEO</div>
                  <div className="text-xs font-medium">Injecting entity-rich language...</div>
               </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>
        </div>
      </div>
    </section>
  );
}
