import { Building2, Menu } from "lucide-react";
import { useState } from "react";

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
            <button className="px-5 py-2.5 text-sm font-medium text-foreground hover:text-gold transition-colors">
              Sign In
            </button>
            <button className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:scale-105 transition-transform shadow-soft">
              Get Started
            </button>
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
                <button className="flex-1 px-5 py-2.5 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors">
                  Sign In
                </button>
                <button className="flex-1 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium">
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
