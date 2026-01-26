import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Project Management',
    description: 'Track all your construction projects from inception to completion with real-time updates.',
  },
  {
    icon: Users,
    title: 'Supplier Network',
    description: 'Connect with verified suppliers and manage relationships in one centralized hub.',
  },
  {
    icon: FileText,
    title: 'Quote Management',
    description: 'Request, compare, and approve quotes seamlessly with our intelligent comparison tools.',
    link: '/quotes',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Make data-driven decisions with comprehensive reporting and trend analysis.',
  },
];

const benefits = [
  { icon: CheckCircle2, text: 'Reduce procurement time by 60%' },
  { icon: Sparkles, text: 'AI-powered supplier matching' },
  { icon: Shield, text: 'Verified supplier network' },
  { icon: Clock, text: 'Real-time project tracking' },
];

const stats = [
  { value: '500+', label: 'Projects Managed' },
  { value: '$2.4B', label: 'Materials Procured' },
  { value: '1,200+', label: 'Active Suppliers' },
  { value: '98%', label: 'Client Satisfaction' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Gold.Arch</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Link to="/quotes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Quotes</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Trusted by 500+ Construction Companies
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Build Smarter with
              <span className="block text-primary">Gold.Arch CRM</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The all-in-one platform for construction companies to manage projects, 
              suppliers, and procurement with unprecedented efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="text-center p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="text-primary"> Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for the construction industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              feature.link ? (
                <Link key={i} to={feature.link} className="block">
                  <Card className="group border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full cursor-pointer">
                    <CardContent className="p-8">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                      <div className="mt-4 flex items-center text-primary font-medium">
                        View Quotes <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card key={i} className="group border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Construction Leaders
                <span className="text-primary"> Choose Us</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                We understand the unique challenges of the construction industry. 
                Our platform is built by industry experts to streamline your operations 
                and maximize profitability.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/quotes">
                  Explore Quotes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-card border border-border/50 shadow-xl flex items-center justify-center">
                  <Building2 className="h-32 w-32 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Construction Business?
          </h2>
          <p className="text-background/70 mb-8 max-w-2xl mx-auto">
            Join hundreds of construction companies already using Gold.Arch to streamline 
            their operations and boost profitability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Gold.Arch</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Gold.Arch Construction CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
