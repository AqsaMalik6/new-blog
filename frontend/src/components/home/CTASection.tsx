import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] -z-10"></div>
      
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto p-12 lg:p-20 rounded-[40px] border border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
           {/* Inner Glow */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

           <h2 className="text-4xl lg:text-6xl font-extrabold mb-8 leading-tight">
            Start generating blogs that <span className="text-primary">actually rank.</span>
           </h2>
           <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            No credit card required. Join hundreds of brands already scaling their content with AI-powered multi-agent intelligence.
           </p>
           <Link
            href="/signup"
            className="inline-block bg-primary text-primary-foreground px-12 py-5 rounded-2xl text-xl font-bold hover:scale-[1.05] transition-transform shadow-2xl shadow-primary/30"
           >
            Get Started Free
           </Link>
           <p className="mt-8 text-sm text-muted-foreground opacity-60 italic">
            Optimised for Google, Answer Engines, and Generative AI.
           </p>
        </div>
      </div>
    </section>
  );
}
