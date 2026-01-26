import { TrendingUp, CheckCircle2, Star, BarChart2 } from "lucide-react";

const Dashboard = () => {
  return (
    <section id="dashboard" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Description */}
          <div>
            <span className="section-label mb-4 block">Insights Hub</span>
            <h2 className="section-title mb-6">
              Supplier Dashboard
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Get a bird's-eye view of your entire supplier network. Track verification rates, 
              monitor ratings, and identify top performers—all in real-time.
            </p>
            
            <div className="space-y-4">
              {[
                "Operational overview with live updates",
                "Category distribution analytics",
                "Rating momentum tracking",
                "Quick actions for supplier management",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            
            <button className="btn-primary mt-8">
              Open Dashboard
            </button>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="card-surface rounded-3xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="section-label">Operational Overview</span>
                <h3 className="text-xl font-display font-semibold text-foreground mt-1">
                  Supplier Dashboard
                </h3>
              </div>
              <span className="pill text-[10px] text-gold border-gold/30 bg-gold/10">
                Updated Live
              </span>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: TrendingUp, label: "Total Suppliers", value: "70", color: "text-gold" },
                { icon: BarChart2, label: "Categories", value: "6", color: "text-gold" },
                { icon: CheckCircle2, label: "Verified", value: "0%", color: "text-emerald-500" },
                { icon: Star, label: "Avg Rating", value: "0.0", color: "text-amber-500" },
              ].map((metric, index) => (
                <div key={index} className="bg-muted/50 rounded-xl p-4">
                  <metric.icon className={`w-5 h-5 ${metric.color} mb-2`} />
                  <div className="text-2xl font-display font-bold text-foreground">
                    {metric.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Top Categories */}
            <div className="bg-muted/30 rounded-xl p-4">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-3">
                Top Categories
              </span>
              <div className="space-y-2">
                {[
                  { name: "Kitchen/Wardrobe", value: "23%" },
                  { name: "Canton Fair", value: "20%" },
                  { name: "Personal Preferences", value: "17%" },
                ].map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <span className="text-sm font-mono text-gold">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
