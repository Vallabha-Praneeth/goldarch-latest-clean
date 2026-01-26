import React, { useState } from 'react';
import { Sidebar, TopBar, MobileNav, MobileTopBar } from './components/Navigation';
import { AIChat } from './components/AIChat';
import { DesignSystemPage } from './components/DesignSystemPage';
import { UserFlows } from './components/UserFlows';
import { DashboardDesktop } from './components/screens/DashboardDesktop';
import { DocumentsDesktop } from './components/screens/DocumentsDesktop';
import { DealsDesktop } from './components/screens/DealsDesktop';
import { SuppliersDesktop } from './components/screens/SuppliersDesktop';
import { DashboardMobile } from './components/screens/DashboardMobile';
import { DocumentsMobile } from './components/screens/DocumentsMobile';
import { QuoteReviewDesktop } from './components/screens/QuoteReviewDesktop';
import { ProductManagementDesktop } from './components/screens/ProductManagementDesktop';
import { ProductCatalogDesktop } from './components/screens/ProductCatalogDesktop';
import { FileText, Palette, Layout, Monitor, Smartphone, GitBranch, BookOpen } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import logoImage from 'figma:asset/logo.png';

type Page = 
  | 'cover'
  | 'design-system'
  | 'components'
  | 'desktop-dashboard'
  | 'desktop-documents'
  | 'desktop-deals'
  | 'desktop-suppliers'
  | 'desktop-quote-review'
  | 'desktop-product-management'
  | 'desktop-product-catalog'
  | 'mobile-dashboard'
  | 'mobile-documents'
  | 'user-flows'
  | 'documentation';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('cover');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiChatExpanded, setAiChatExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'cover':
        return <CoverPage onNavigate={setCurrentPage} />;
      case 'design-system':
        return <DesignSystemPage />;
      case 'components':
        return <ComponentsPage />;
      case 'desktop-dashboard':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/dashboard"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Dashboard" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <DashboardDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-documents':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/documents"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Documents" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <DocumentsDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-deals':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/deals"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Deal Pipeline" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <DealsDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-suppliers':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/suppliers"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Suppliers" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <SuppliersDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-quote-review':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/quote-review"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Quote Review" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <QuoteReviewDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-product-management':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/product-management"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Product Management" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <ProductManagementDesktop />
              </div>
            </div>
          </div>
        );
      case 'desktop-product-catalog':
        return (
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              activePath="/product-catalog"
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar title="Product Catalog" />
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
                <ProductCatalogDesktop />
              </div>
            </div>
          </div>
        );
      case 'mobile-dashboard':
        return (
          <div className="w-[375px] h-[812px] mx-auto bg-white shadow-2xl overflow-hidden rounded-3xl border-8 border-[#111827]">
            <div className="h-full overflow-y-auto bg-[#F9FAFB]">
              <MobileTopBar title="Dashboard" />
              <DashboardMobile />
              <MobileNav activePath="/dashboard" />
            </div>
          </div>
        );
      case 'mobile-documents':
        return (
          <div className="w-[375px] h-[812px] mx-auto bg-white shadow-2xl overflow-hidden rounded-3xl border-8 border-[#111827]">
            <div className="h-full overflow-y-auto bg-[#F9FAFB]">
              <MobileTopBar title="Documents" />
              <DocumentsMobile />
              <MobileNav activePath="/documents" />
            </div>
          </div>
        );
      case 'user-flows':
        return <UserFlows />;
      case 'documentation':
        return <DocumentationPage />;
      default:
        return <CoverPage onNavigate={setCurrentPage} />;
    }
  };

  const showAIChat = currentPage.startsWith('desktop-');

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Navigation Bar */}
      {currentPage !== 'cover' && !currentPage.startsWith('desktop-') && !currentPage.startsWith('mobile-') && (
        <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('cover')}
              className="flex items-center gap-2 text-[#111827] hover:text-[#2563EB] transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#EA580C] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GA</span>
              </div>
              <span className="font-bold text-lg">Gold.Arch</span>
            </button>
            <div className="flex gap-1">
              <NavButton
                active={currentPage === 'design-system'}
                onClick={() => setCurrentPage('design-system')}
              >
                Design System
              </NavButton>
              <NavButton
                active={currentPage === 'components'}
                onClick={() => setCurrentPage('components')}
              >
                Components
              </NavButton>
              <NavButton
                active={currentPage === 'user-flows'}
                onClick={() => setCurrentPage('user-flows')}
              >
                User Flows
              </NavButton>
              <NavButton
                active={currentPage === 'documentation'}
                onClick={() => setCurrentPage('documentation')}
              >
                Documentation
              </NavButton>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className={currentPage.startsWith('mobile-') ? 'py-12 bg-[#1F2937]' : ''}>
        {renderPage()}
      </div>

      {/* AI Chat Widget - Only on desktop screens */}
      {showAIChat && (
        <AIChat
          isExpanded={aiChatExpanded}
          onToggle={() => setAiChatExpanded(!aiChatExpanded)}
        />
      )}
    </div>
  );
}

// Helper Components
const NavButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 text-sm font-medium rounded-lg transition-colors
      ${active
        ? 'bg-[#2563EB] text-white'
        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
      }
    `}
  >
    {children}
  </button>
);

const CoverPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151] flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <ImageWithFallback 
            src={logoImage} 
            alt="Gold.Arch Logo"
            className="w-24 h-24 mx-auto mb-8 object-contain"
          />
          <h1 className="text-6xl font-bold text-white mb-6">Gold.Arch</h1>
          <p className="text-2xl text-[#9CA3AF] mb-4">
            B2B Construction CRM Design System
          </p>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            A complete UI/UX design system ready for Next.js + Tailwind CSS + shadcn-ui
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {/* Design System */}
          <button
            onClick={() => onNavigate('design-system')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <Palette className="h-12 w-12 text-[#F59E0B] mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-white mb-2">Design System</h3>
            <p className="text-sm text-[#9CA3AF]">
              Colors, typography, spacing, shadows & AI glow
            </p>
          </button>

          {/* Components */}
          <button
            onClick={() => onNavigate('components')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <Layout className="h-12 w-12 text-[#2563EB] mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-white mb-2">Components</h3>
            <p className="text-sm text-[#9CA3AF]">
              Buttons, forms, cards, tables, navigation & AI chat
            </p>
          </button>

          {/* User Flows */}
          <button
            onClick={() => onNavigate('user-flows')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <GitBranch className="h-12 w-12 text-[#8B5CF6] mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-white mb-2">User Flows</h3>
            <p className="text-sm text-[#9CA3AF]">
              Upload→AI & AI Chat interaction patterns
            </p>
          </button>
        </div>

        {/* Screens Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Desktop Screens */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="h-8 w-8 text-[#10B981]" />
              <h3 className="text-xl font-semibold text-white">Desktop Screens (1440px)</h3>
            </div>
            <div className="space-y-3">
              <ScreenButton onClick={() => onNavigate('desktop-dashboard')}>
                Dashboard
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-documents')}>
                Documents
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-deals')}>
                Deal Pipeline
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-suppliers')}>
                Suppliers
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-quote-review')}>
                Quote Review
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-product-management')}>
                Product Management
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('desktop-product-catalog')}>
                Product Catalog
              </ScreenButton>
            </div>
          </div>

          {/* Mobile Screens */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="h-8 w-8 text-[#EC4899]" />
              <h3 className="text-xl font-semibold text-white">Mobile Screens (375px)</h3>
            </div>
            <div className="space-y-3">
              <ScreenButton onClick={() => onNavigate('mobile-dashboard')}>
                Dashboard Mobile
              </ScreenButton>
              <ScreenButton onClick={() => onNavigate('mobile-documents')}>
                Documents Mobile
              </ScreenButton>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('documentation')}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all group"
          >
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-[#3B82F6]" />
              <h3 className="text-xl font-semibold text-white">Documentation & Handoff Notes</h3>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-[#6B7280]">
          <p>Ready for Next.js + Tailwind CSS v4 + shadcn-ui</p>
          <p className="mt-2">Design tokens, components, and screens built with accessibility and performance in mind</p>
        </div>
      </div>
    </div>
  );
};

const ScreenButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all text-left"
  >
    {children}
  </button>
);

const ComponentsPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-display-36 text-[#111827] mb-4">Component Library</h1>
        <p className="text-body text-[#6B7280]">
          All components are built with variants, states, and full accessibility support
        </p>
      </div>

      <div className="space-y-12">
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <h2 className="text-h2 text-[#111827] mb-6">✅ Component Checklist</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-h4 text-[#111827] mb-4">Core Components</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>✓ Buttons (6 variants × 3 sizes × 5 states)</li>
                <li>✓ Form Controls (input, search, select, textarea, file upload)</li>
                <li>✓ Cards (Supplier, Project, Document, Deal)</li>
                <li>✓ Data Table (sortable, selectable, with filters)</li>
                <li>✓ Badges & Tags (6 status variants)</li>
                <li>✓ Modals (Standard & AI Summary)</li>
                <li>✓ Navigation (Desktop sidebar, Top bar, Mobile nav)</li>
                <li>✓ KPI Cards with trend indicators</li>
                <li>✓ Timeline component</li>
              </ul>
            </div>
            <div>
              <h3 className="text-h4 text-[#111827] mb-4">Special Features</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>✓ AI Chat Widget (collapsed/expanded states)</li>
                <li>✓ File Upload with drag & drop</li>
                <li>✓ Upload Progress with AI processing states</li>
                <li>✓ Empty States</li>
                <li>✓ Skeleton Loading</li>
                <li>✓ Filter & Search Components</li>
                <li>✓ View Toggle (Grid/List)</li>
                <li>✓ Citation Pills for AI responses</li>
                <li>✓ Responsive layouts (Desktop 1440 / Mobile 375)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <h2 className="text-h2 text-[#111827] mb-6">📱 Screen Implementations</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-h4 text-[#111827] mb-4">Desktop Screens (1440px)</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>✓ Dashboard: KPIs + Timeline + Deal Pipeline Kanban</li>
                <li>✓ Documents: Upload CTA, Grid/List view, AI Summarize</li>
                <li>✓ Deals: 5-column Kanban with pipeline summary</li>
                <li>✓ Suppliers: Data table with filters & empty state</li>
                <li>✓ Quote Review: Detailed quote analysis and approval</li>
                <li>✓ Product Management: Inventory and product lifecycle management</li>
                <li>✓ Product Catalog: Browse and manage product offerings</li>
              </ul>
            </div>
            <div>
              <h3 className="text-h4 text-[#111827] mb-4">Mobile Screens (375px)</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>✓ Dashboard: Quick stats, Activity timeline, Tasks, FAB</li>
                <li>✓ Documents: Filter chips, Row layout (88px), Upload FAB</li>
                <li>✓ Bottom navigation with 5 icons</li>
                <li>✓ Mobile top bar with menu & notifications</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-xl p-8 text-white">
          <h2 className="text-h2 mb-6">🤖 AI-Powered Features</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Chat Widget</h3>
              <p className="text-sm text-white/80">
                Floating assistant with context-aware search, typing indicators, and citation pills
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">Document Processing</h3>
              <p className="text-sm text-white/80">
                Upload → AI processing → Summary generation with visual feedback
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Glow Effect</h3>
              <p className="text-sm text-white/80">
                Subtle purple glow for AI-powered features to create visual distinction
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const DocumentationPage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-display-36 text-[#111827] mb-4">Documentation & Handoff</h1>
        <p className="text-body text-[#6B7280]">
          Implementation guide for developers
        </p>
      </div>

      <div className="space-y-8">
        {/* Tech Stack */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <h2 className="text-h2 text-[#111827] mb-6">🛠️ Tech Stack</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#111827] mb-3">Required</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li>• Next.js 14+ (App Router or Pages Router)</li>
                <li>• React 18+</li>
                <li>• Tailwind CSS v4</li>
                <li>• TypeScript (recommended)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#111827] mb-3">Optional</h3>
              <ul className="space-y-2 text-[#6B7280]">
                <li>• shadcn-ui components</li>
                <li>• lucide-react for icons</li>
                <li>• Framer Motion for animations</li>
                <li>• React Hook Form for forms</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Implementation Guide */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <h2 className="text-h2 text-[#111827] mb-6">📋 Implementation Guide</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-h4 text-[#111827] mb-3">1. Design Tokens</h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <p className="text-sm text-[#6B7280] mb-2">
                  All design tokens are defined in <code className="text-code bg-[#E5E7EB] px-2 py-0.5 rounded">/styles/globals.css</code>
                </p>
                <ul className="text-sm text-[#6B7280] space-y-1 ml-4">
                  <li>• CSS custom properties for colors, spacing, shadows</li>
                  <li>• Utility classes for typography</li>
                  <li>• Tailwind v4 compatible</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-h4 text-[#111827] mb-3">2. Component Structure</h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <p className="text-sm text-[#6B7280] mb-2">Components are organized by type:</p>
                <ul className="text-sm text-[#6B7280] space-y-1 ml-4">
                  <li>• <code className="text-code bg-[#E5E7EB] px-2 py-0.5 rounded">/components/</code> - Core reusable components</li>
                  <li>• <code className="text-code bg-[#E5E7EB] px-2 py-0.5 rounded">/components/screens/</code> - Full page layouts</li>
                  <li>• All components are TypeScript with proper prop types</li>
                  <li>• Fully responsive with mobile-first approach</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-h4 text-[#111827] mb-3">3. Responsive Breakpoints</h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <ul className="text-sm text-[#6B7280] space-y-1">
                  <li>• Mobile: 375px baseline (iPhone SE/13/14)</li>
                  <li>• Tablet: 768px and up</li>
                  <li>• Desktop: 1440px baseline</li>
                  <li>• Max content width: 1920px</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-h4 text-[#111827] mb-3">4. Accessibility</h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <ul className="text-sm text-[#6B7280] space-y-1">
                  <li>• WCAG 2.1 AA compliant colors (4.5:1 contrast ratio)</li>
                  <li>• Minimum touch targets: 44×44px (mobile)</li>
                  <li>• Focus indicators on all interactive elements</li>
                  <li>• Semantic HTML with proper ARIA labels</li>
                  <li>• Keyboard navigation support</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-h4 text-[#111827] mb-3">5. Performance</h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
                <ul className="text-sm text-[#6B7280] space-y-1">
                  <li>• No layout shift (fixed heights where needed)</li>
                  <li>• Skeleton states for loading</li>
                  <li>• Optimistic UI updates</li>
                  <li>• Lazy loading for heavy components</li>
                  <li>• Virtualization for long lists</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* File Structure */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <h2 className="text-h2 text-[#111827] mb-6">📁 File Structure</h2>
          <div className="bg-[#111827] rounded-lg p-6 text-[#10B981] font-mono text-sm">
            <pre>{`gold-arch-crm/
├── app/                    # Next.js App Router
│   ├── dashboard/
│   ├── documents/
│   ├── deals/
│   └── suppliers/
├── components/             # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── DataTable.tsx
│   ├── Navigation.tsx
│   ├── Modal.tsx
│   ├── AIChat.tsx
│   ├── KPICard.tsx
│   ├── Timeline.tsx
│   ├── FileUpload.tsx
│   └── screens/           # Full page layouts
│       ├── DashboardDesktop.tsx
│       ├── DocumentsDesktop.tsx
│       ├── DealsDesktop.tsx
│       ├── SuppliersDesktop.tsx
│       ├── DashboardMobile.tsx
│       └── DocumentsMobile.tsx
├── styles/
│   └── globals.css        # Design tokens + Tailwind
├── public/
│   └── assets/
└── lib/                   # Utilities & helpers`}</pre>
          </div>
        </section>

        {/* Key Features */}
        <section className="bg-gradient-to-r from-[#2563EB] to-[#1E40AF] rounded-xl p-8 text-white">
          <h2 className="text-h2 mb-6">✨ Key Features & Highlights</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Design Excellence</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Clean B2B SaaS aesthetic</li>
                <li>• AI-forward but subtle branding</li>
                <li>• Consistent 8px spacing grid</li>
                <li>• Cohesive color system</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Developer Experience</h3>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• TypeScript throughout</li>
                <li>• Composable components</li>
                <li>• Clear prop interfaces</li>
                <li>• Easy to customize</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <section className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-6">
          <h3 className="text-h4 text-[#92400E] mb-3">⚠️ Important Notes</h3>
          <ul className="space-y-2 text-sm text-[#92400E]">
            <li>• This is a design system showcase - integrate with your backend/API</li>
            <li>• AI features shown with mock data - connect to your AI service</li>
            <li>• All states (loading, error, empty) are implemented</li>
            <li>• Test thoroughly in target browsers before production</li>
            <li>• Consider adding E2E tests for critical user flows</li>
          </ul>
        </section>
      </div>
    </div>
  );
};