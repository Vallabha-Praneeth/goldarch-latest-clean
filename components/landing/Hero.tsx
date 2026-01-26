import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const Hero = ({ suppliers = [], categories = [] }: any) => {
  const totalSuppliers = suppliers.length;
  const totalCategories = categories.length;
  const verifiedSuppliers = suppliers.filter((s: any) => s.verified).length;
  const verificationRate = totalSuppliers > 0 ? Math.round((verifiedSuppliers / totalSuppliers) * 100) : 100;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-aurora">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-gold/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-navy-light/20 blur-3xl animate-float-delayed" />
      
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 pill mb-8 animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-muted-foreground">Trusted Supply Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.1] mb-6 animate-fade-up-delay">
            Build Smarter Supply Chains with{" "}
            <span className="text-gold">Gold.Arch</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up-late">
            A curated view of your construction partners, insights, and performance. 
            Navigate {totalCategories} categories with precision and speed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up-late">
            <Link href="/app-dashboard" className="btn-gold flex items-center gap-2 group">
              Launch Supplier Atlas
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/app-dashboard" className="btn-secondary">
              View Dashboard
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-up-late">
            {[
              { value: `${totalSuppliers}+`, label: "Active Suppliers" },
              { value: totalCategories, label: "Categories" },
              { value: `${verificationRate}%`, label: "Verified Partners" },
              { value: "24/7", label: "Live Updates" },
            ].map((stat, index) => (
              <div key={index} className="card-surface rounded-2xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
