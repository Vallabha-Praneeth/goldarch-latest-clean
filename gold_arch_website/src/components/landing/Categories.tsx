import { ArrowUpRight } from "lucide-react";

const categories = [
  { name: "Kitchen/Wardrobe Cabinets", count: 16, icon: "🏠", percentage: 23 },
  { name: "Canton Fair", count: 14, icon: "🏢", percentage: 20 },
  { name: "Personal Preferences", count: 12, icon: "⭐", percentage: 17 },
  { name: "Door and Wall Panels", count: 12, icon: "🚪", percentage: 17 },
  { name: "Main Doors", count: 9, icon: "🔐", percentage: 13 },
  { name: "LED Lighting", count: 7, icon: "💡", percentage: 10 },
];

const Categories = () => {
  return (
    <section id="categories" className="py-24 bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-gold/15 blur-3xl animate-float" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="section-label mb-4 block">Supplier Categories</span>
            <h2 className="section-title">
              6 Product Categories
            </h2>
          </div>
          <button className="btn-secondary self-start md:self-auto flex items-center gap-2 group">
            View All Suppliers
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="card-surface-hover rounded-2xl p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="pill text-[10px] mb-3 inline-block">Category</span>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                    {category.name}
                  </h3>
                </div>
                <span className="text-3xl">{category.icon}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {category.count}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {category.percentage}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-1000"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {category.count === 1 ? 'supplier' : 'suppliers'} in network
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
