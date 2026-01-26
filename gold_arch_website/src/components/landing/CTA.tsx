import { ArrowRight, Building2 } from "lucide-react";

const CTA = () => {
  return (
    <section id="contact" className="py-24 bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-gold/20 blur-3xl animate-float" />
      <div className="absolute top-1/4 left-0 w-64 h-64 rounded-full bg-navy-light/15 blur-3xl animate-float-delayed" />
      
      <div className="relative max-w-4xl mx-auto px-6">
        <div className="card-surface rounded-3xl p-10 md:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-8 shadow-gold">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Ready to Streamline Your Supply Chain?
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join Gold.Arch Construction and get access to our curated network of 70+ verified 
            suppliers across 6 product categories.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-gold flex items-center gap-2 group">
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-secondary">
              Schedule a Demo
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free to explore
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
