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
