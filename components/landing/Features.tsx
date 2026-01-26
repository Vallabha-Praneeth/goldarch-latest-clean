import { BarChart3, Shield, Zap, Users, Globe, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Supplier Directory",
    description: "Access 70+ verified construction suppliers organized across 6 categories for quick navigation.",
  },
  {
    icon: Shield,
    title: "Verified Partners",
    description: "Every supplier goes through our verification process to ensure quality and reliability.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time insights into supplier performance, ratings, and category distribution.",
  },
  {
    icon: Zap,
    title: "Live Updates",
    description: "Supplier data updates in real-time. Always stay informed with the latest information.",
  },
  {
    icon: Globe,
    title: "Global Network",
    description: "From Canton Fair sourcing to local preferences, manage suppliers worldwide.",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "Monitor rating momentum, verification ratios, and category growth over time.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label mb-4 block">Features</span>
          <h2 className="section-title mb-4">
            Everything You Need to Manage Suppliers
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful tools designed for construction professionals who value efficiency and precision.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-surface-hover rounded-2xl p-8 group"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
