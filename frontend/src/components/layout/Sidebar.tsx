import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Newspaper, 
  ShieldAlert, 
  MessageSquare, 
  StickyNote, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  User, 
  LogOut,
  ChevronLeft,
  Shield,
  History,
  X
} from 'lucide-react';

import { cn } from '../ui/utils';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Badge } from '../ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'News Feed', href: '/news', icon: Newspaper },
  { name: 'Fake News Detector', href: '/detector', icon: ShieldAlert },
  { name: 'Prediction History', href: '/predictions', icon: History },
  { name: 'AI Chat Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Notes Manager', href: '/notes', icon: StickyNote },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Sentiment Analysis', href: '/sentiment', icon: TrendingUp },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
];

const secondaryNav = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout, user, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = () => {
    // Close drawer on mobile after navigation
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 h-screen',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg truncate">TrueLens</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Collapse button for desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden md:block"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-6 space-y-3">
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Administration
                </span>
              </div>
            )}
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User & Logout */}
      <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user.fullName}
              </p>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 flex-shrink-0">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};