import { Search, MessageCircle, Bot } from "lucide-react";

const strategies = [
  {
    icon: <Search className="w-8 h-8" />,
    title: "Search Engine Optimisation",
    label: "SEO",
    description: "Our SEO agent handles keyword placement, heading hierarchy, meta tags, and internal link strategies to ensure your content is fully crawlable and rankable on Google.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Answer Engine Optimisation",
    label: "AEO",
    description: "Go beyond standard search with AEO. We generate FAQ schema, featured snippet paragraphs, and direct-answer content tailored for Google's answer boxes and voice search.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  },
  {
    icon: <Bot className="w-8 h-8" />,
    title: "Generative Engine Optimisation",
    label: "GEO",
    description: "The future of visibility. We use entity-rich definitions and citation-worthy phrasing so AI tools like ChatGPT and Gemini cite your brand as a source of authority.",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20"
  }
];

export default function StrategySection() {
  return (
    <section id="strategies" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">Three Strategies. One Blog. Complete Visibility.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Traditional tools only focus on SEO. We address the three pillars of modern content discovery simultaneously in every generation run.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {strategies.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-3xl border ${item.border} ${item.bg} hover:scale-[1.03] transition-all duration-300 group`}
            >
              <div className={`${item.color} mb-6 p-3 w-fit rounded-2xl bg-background/50 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="text-xs font-bold tracking-widest uppercase mb-2 opacity-70">{item.label}</div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
