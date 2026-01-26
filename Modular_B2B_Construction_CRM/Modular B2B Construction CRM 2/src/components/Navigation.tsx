import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Building2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Menu,
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FileText className="h-5 w-5" />, label: 'Documents', path: '/documents', badge: 3 },
  { icon: <Briefcase className="h-5 w-5" />, label: 'Deals', path: '/deals' },
  { icon: <Building2 className="h-5 w-5" />, label: 'Suppliers', path: '/suppliers' },
  { icon: <Users className="h-5 w-5" />, label: 'Contacts', path: '/contacts' },
  { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  activePath?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath = '/dashboard',
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`
        bg-white border-r border-[#E5E7EB] h-screen flex flex-col transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB]">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#EA580C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GA</span>
            </div>
            <span className="font-bold text-lg text-[#111827]">Gold.Arch</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#EA580C] rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">GA</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-[#DBEAFE] text-[#2563EB] border-l-4 border-l-[#2563EB] -ml-3 pl-[8px]'
                      : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]'
                    }
                  `}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="bg-[#2563EB] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute right-1 top-1 w-2 h-2 bg-[#2563EB] rounded-full" />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-3 border-t border-[#E5E7EB]">
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!collapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

interface TopBarProps {
  title: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showSearch = true,
  actions,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8">
      <h1 className="text-h3 text-[#111827]">{title}</h1>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            />
          </div>
        )}
        
        <button className="relative p-2 text-[#4B5563] hover:bg-[#F9FAFB] rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
          <div className="w-9 h-9 bg-[#2563EB] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">JD</span>
          </div>
        </div>

        {actions}
      </div>
    </header>
  );
};

interface MobileNavProps {
  activePath?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activePath = '/dashboard' }) => {
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] flex items-center justify-around px-2 z-50">
      {mobileItems.map((item) => {
        const isActive = activePath === item.path;
        return (
          <a
            key={item.path}
            href={item.path}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[60px]
              ${isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'}
            `}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

interface MobileTopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ title, onMenuClick }) => {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4">
      <button
        onClick={onMenuClick}
        className="p-2 text-[#4B5563] hover:bg-[#F9FAFB] rounded-lg transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <h1 className="text-h4 text-[#111827] font-semibold">{title}</h1>
      
      <button className="relative p-2 text-[#4B5563] hover:bg-[#F9FAFB] rounded-lg transition-colors">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
      </button>
    </header>
  );
};
