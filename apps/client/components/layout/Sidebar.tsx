"use client";

import { useState,useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  CheckSquare,
  CreditCard,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'My Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, workspaces, switchWorkspace } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitch = (workspaceId: string) => {
    if (workspaceId === workspace?.id) {
      setIsDropdownOpen(false);
      return;
    }
    switchWorkspace(workspaceId);
    setIsDropdownOpen(false);
    // Refresh the page to reload all data for new workspace
    router.refresh();
    router.push('/dashboard');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/30 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={cn(
          'w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen shrink-0',
          'transition-transform duration-200 ease-in-out z-40',
          'fixed inset-y-0 left-0 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >

      {/* ── Workspace Switcher ── */}
      <div className="relative border-b border-gray-200">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-4 flex items-center justify-between
          hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Workspace avatar */}
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex
            items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {mounted && workspace?.name ? workspace.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {mounted && workspace?.name ? workspace.name : 'Loading...'}
              </p>
              <p className="text-xs text-gray-400">
                {mounted && workspace?.plan === 'PRO' ? '⚡ Pro' : '🆓 Free'}
              </p>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-gray-400 transition-transform shrink-0',
              isDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 bg-white
            border border-gray-200 rounded-b-xl shadow-lg z-20
            overflow-hidden">

              {/* All workspaces */}
              <div className="p-1.5">
                <p className="text-xs text-gray-400 font-medium px-2
                py-1.5 uppercase tracking-wide">
                  Your workspaces
                </p>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitch(ws.id)}
                    className="w-full flex items-center gap-2.5 px-2
                    py-2 rounded-lg hover:bg-gray-50 transition-colors
                    text-left"
                  >
                    {/* Mini avatar */}
                    <div className="w-6 h-6 bg-indigo-100 rounded-md
                    flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-700">
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {ws.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ws.plan === 'PRO' ? '⚡ Pro' : '🆓 Free'} ·{' '}
                        {ws.role}
                      </p>
                    </div>
                    {/* Active check */}
                    {ws.id === workspace?.id && (
                      <Check size={14} className="text-indigo-600
                      shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create new workspace */}
              <div className="border-t border-gray-100 p-1.5">
                <Link
                  href="/create-workspace"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-2 py-2
                  rounded-lg hover:bg-gray-50 transition-colors
                  text-sm text-gray-600"
                >
                  <Plus size={14} className="text-gray-400" />
                  Create new workspace
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                'transition-colors duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon
                size={18}
                className={cn(
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          'text-xs font-medium px-2 py-1 rounded-full w-fit',
          (mounted && workspace?.plan === 'PRO')
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-gray-100 text-gray-600'
        )}>
          {(mounted && workspace?.plan === 'PRO') ? '⚡ Pro Plan' : '🆓 Free Plan'}
        </div>
      </div>
      </aside>
    </>
  );
}
