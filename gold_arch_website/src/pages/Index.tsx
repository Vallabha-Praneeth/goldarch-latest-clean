import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Categories from "@/components/landing/Categories";
import Dashboard from "@/components/landing/Dashboard";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Categories />
        <Dashboard />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
