import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto p-10 lg:p-16 rounded-[40px] border border-blue-500/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Inner Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

          <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight text-white">
            Start generating blogs that <br />
            <span className="text-blue-500">actually rank.</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            No credit card required. Join hundreds of brands already scaling their content with AI-powered multi-agent intelligence.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:scale-[1.05] transition-transform shadow-2xl shadow-blue-600/20"
          >
            Get Started Free
          </Link>
          <p className="mt-8 text-xs text-slate-500 opacity-60 italic">
            Optimised for Google, Answer Engines, and Generative AI.
          </p>
        </div>
      </div>
    </section>
  );
}
