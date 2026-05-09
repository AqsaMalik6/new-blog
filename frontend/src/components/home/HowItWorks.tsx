import { Globe, Search, MessageSquare, Bot, PenTool, ShieldCheck, Zap } from "lucide-react";

const steps = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Request",
    desc: "Enter a topic or product URL."
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "Research",
    desc: "Our agents scrape and research."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "SEO",
    desc: "Optimised for Google ranking."
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "AEO",
    desc: "Snippet & voice search ready."
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "GEO",
    desc: "Entity-rich for AI citation."
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: "Writing",
    desc: "1200+ words of expert content."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Verify",
    desc: "Guardrail quality validation."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our multi-agent pipeline works in parallel to transform a simple prompt into a high-performance content asset.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-6 shadow-xl shadow-primary/10 relative">
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                    {idx + 1}
                  </div>
                  <div className="text-primary">{step.icon}</div>
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-tight px-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
