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
