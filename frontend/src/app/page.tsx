import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import StrategySection from "@/components/home/StrategySection";
import HowItWorks from "@/components/home/HowItWorks";
import ComparisonTable from "@/components/home/ComparisonTable";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StrategySection />
      <HowItWorks />
      <ComparisonTable />
      <CTASection />
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold">
            AI<span className="text-primary">Blog</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Blog Generator. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
