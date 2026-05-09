import { Check, X } from "lucide-react";

const features = [
  { name: "SEO Optimisation", us: true, jasper: "Partial", copy: "Partial", surfer: true },
  { name: "AEO Optimisation", us: true, jasper: false, copy: false, surfer: false },
  { name: "GEO Optimisation", us: true, jasper: false, copy: false, surfer: false },
  { name: "URL-to-Blog Pipeline", us: true, jasper: false, copy: false, surfer: false },
  { name: "Multi-Agent System", us: true, jasper: false, copy: false, surfer: false },
  { name: "Auto Fallback LLM", us: true, jasper: false, copy: false, surfer: false },
  { name: "Brand-Scoped History", us: true, jasper: true, copy: true, surfer: false },
];

export default function ComparisonTable() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Brands Choose Us Over the Rest</h2>
          <p className="text-muted-foreground text-lg">Compare our features with industry leaders.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-6 px-4 font-semibold text-muted-foreground">Feature</th>
                <th className="py-6 px-4 font-bold text-lg bg-primary/10 text-primary text-center rounded-t-2xl">This Platform</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-center">Jasper</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-center">Copy.ai</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-center">Surfer SEO</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-border group hover:bg-muted/30 transition-colors">
                  <td className="py-6 px-4 font-medium">{f.name}</td>
                  <td className="py-6 px-4 bg-primary/5 text-center">
                    <Check className="w-6 h-6 text-green-500 mx-auto" />
                  </td>
                  <td className="py-6 px-4 text-center">
                    {f.jasper === true ? <Check className="w-6 h-6 text-green-500/50 mx-auto" /> : 
                     f.jasper === false ? <X className="w-6 h-6 text-muted-foreground/30 mx-auto" /> :
                     <span className="text-xs font-bold uppercase opacity-50">{f.jasper}</span>}
                  </td>
                  <td className="py-6 px-4 text-center">
                    {f.copy === true ? <Check className="w-6 h-6 text-green-500/50 mx-auto" /> : 
                     f.copy === false ? <X className="w-6 h-6 text-muted-foreground/30 mx-auto" /> :
                     <span className="text-xs font-bold uppercase opacity-50">{f.copy}</span>}
                  </td>
                  <td className="py-6 px-4 text-center">
                    {f.surfer === true ? <Check className="w-6 h-6 text-green-500/50 mx-auto" /> : 
                     f.surfer === false ? <X className="w-6 h-6 text-muted-foreground/30 mx-auto" /> :
                     <span className="text-xs font-bold uppercase opacity-50">{f.surfer}</span>}
                  </td>
                </tr>
              ))}
              <tr>
                <td></td>
                <td className="bg-primary/10 rounded-b-2xl py-4"></td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
