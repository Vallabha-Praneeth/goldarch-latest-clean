# Source Code (Next.js Landing)

## /app/page.tsx
```tsx
'use client';

import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Categories from "@/components/landing/Categories";
import Dashboard from "@/components/landing/Dashboard";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { useSuppliers } from '../lib/use-suppliers';

const Index = () => {
  const { suppliers, categories, loading } = useSuppliers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aurora">
        <div className="text-center">
          <p className="text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero suppliers={suppliers} categories={categories} />
        <Features />
        <Categories suppliers={suppliers} categories={categories} />
        <Dashboard suppliers={suppliers} categories={categories} />
        <CTA suppliers={suppliers} categories={categories} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
```

## /components/landing/Header.tsx
```tsx
import { Building2, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/70 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground block">
                Gold.Arch
              </span>
              <span className="font-display font-semibold text-foreground">
                Construction CRM
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </a>
            <a href="#dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth" className="px-5 py-2.5 text-sm font-medium text-foreground hover:text-gold transition-colors">
              Sign In
            </Link>
            <Link href="/app-dashboard" className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:scale-105 transition-transform shadow-soft">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/40 pt-4">
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </a>
              <a href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Categories
              </a>
              <a href="#dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Dashboard
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Contact
              </a>
              <div className="flex gap-3 mt-2">
                <Link href="/auth" className="flex-1 px-5 py-2.5 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors text-center">
                  Sign In
                </Link>
                <Link href="/app-dashboard" className="flex-1 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium text-center">
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
```

## /components/landing/Hero.tsx
```tsx
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
```

## /components/landing/Features.tsx
```tsx
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
```

## /components/landing/Categories.tsx
```tsx
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('kitchen') || name.includes('wardrobe') || name.includes('cabinet')) return '🏠';
  if (name.includes('canton') || name.includes('fair')) return '🏢';
  if (name.includes('personal') || name.includes('preference')) return '⭐';
  if (name.includes('door') && name.includes('panel')) return '🚪';
  if (name.includes('main door')) return '🔐';
  if (name.includes('led') || name.includes('lighting')) return '💡';
  return '📦';
};

const Categories = ({ categories = [], suppliers = [] }: any) => {
  const totalSuppliers = suppliers.length || 1;
  const categoriesData = categories.map((cat: any) => ({
    name: cat.name,
    count: cat.count,
    icon: getCategoryIcon(cat.name),
    percentage: Math.round((cat.count / totalSuppliers) * 100)
  }));
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
              {categories.length} Product Categories
            </h2>
          </div>
          <Link href="/app-dashboard/suppliers" className="btn-secondary self-start md:self-auto flex items-center gap-2 group">
            View All Suppliers
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesData.map((category, index) => (
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
```

## /components/landing/Dashboard.tsx
```tsx
import { TrendingUp, CheckCircle2, Star, BarChart2 } from "lucide-react";
import Link from "next/link";

const Dashboard = ({ suppliers = [], categories = [] }: any) => {
  const totalSuppliers = suppliers.length;
  const totalCategories = categories.length;
  const verifiedSuppliers = suppliers.filter((s: any) => s.verified).length;
  const verificationRate = totalSuppliers > 0 ? Math.round((verifiedSuppliers / totalSuppliers) * 100) : 0;
  const ratedSuppliers = suppliers.filter((s: any) => s.ownerRating > 0);
  const avgRating = ratedSuppliers.length > 0
    ? (ratedSuppliers.reduce((sum: number, s: any) => sum + s.ownerRating, 0) / ratedSuppliers.length).toFixed(1)
    : '0.0';
  const topCategories = categories.slice(0, 3).map((cat: any) => ({
    name: cat.name,
    percentage: Math.round((cat.count / (totalSuppliers || 1)) * 100)
  }));

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

            <Link href="/app-dashboard" className="btn-primary mt-8">
              Open Dashboard
            </Link>
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
                { icon: TrendingUp, label: "Total Suppliers", value: totalSuppliers, color: "text-gold" },
                { icon: BarChart2, label: "Categories", value: totalCategories, color: "text-gold" },
                { icon: CheckCircle2, label: "Verified", value: `${verificationRate}%`, color: "text-emerald-500" },
                { icon: Star, label: "Avg Rating", value: avgRating, color: "text-amber-500" },
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
                {topCategories.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <span className="text-sm font-mono text-gold">{cat.percentage}%</span>
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
```

## /components/landing/CTA.tsx
```tsx
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

const CTA = ({ suppliers = [], categories = [] }: any) => {
  const totalSuppliers = suppliers.length;
  const totalCategories = categories.length;

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
            Join Gold.Arch Construction and get access to our curated network of {totalSuppliers}+ verified
            suppliers across {totalCategories} product categories.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app-dashboard" className="btn-gold flex items-center gap-2 group">
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth" className="btn-secondary">
              Schedule a Demo
            </Link>
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
```

## /components/landing/Footer.tsx
```tsx
import { Building2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-background/60 block">
                Gold.Arch
              </span>
              <span className="font-display font-semibold text-background">
                Construction CRM
              </span>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-sm text-background/70 hover:text-background transition-colors">
              Features
            </a>
            <a href="#categories" className="text-sm text-background/70 hover:text-background transition-colors">
              Categories
            </a>
            <a href="#dashboard" className="text-sm text-background/70 hover:text-background transition-colors">
              Dashboard
            </a>
            <a href="#contact" className="text-sm text-background/70 hover:text-background transition-colors">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-background/50 font-mono">
            © 2024 Gold.Arch Construction. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```
