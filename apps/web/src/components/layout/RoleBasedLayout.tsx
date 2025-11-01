import React, { useState, useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useAuthUser } from '@/stores/authStore';
import { UserRole } from '@packages/shared-types';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import RoleBasedHeader from './RoleBasedHeader';
import { Toaster } from '@/components/ui/sonner';

interface RoleBasedLayoutProps {
  children?: React.ReactNode;
}

const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ children }) => {
  const user = useAuthUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Get user role with fallback
  const userRole = (user?.role?.[0] || UserRole.USER) as UserRole;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on smaller screens
      if (mobile) {
        setIsSidebarCollapsed(false);
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger-button');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            hamburger && !hamburger.contains(event.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out',
          // Desktop behavior
          'lg:relative lg:z-auto lg:translate-x-0',
          // Mobile behavior
          isMobile ? (
            isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'
          ) : (
            // Desktop collapsed/expanded
            isSidebarCollapsed ? 'w-16' : 'w-80'
          ),
          // Shadow and backdrop
          'shadow-xl lg:shadow-none'
        )}
      >
        <Sidebar
          isCollapsed={!isMobile && isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          setCurrentView={() => {}} // Legacy prop
          setCurrentPath={() => {}} // Legacy prop
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <RoleBasedHeader
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={toggleSidebar}
          userRole={userRole}
          hamburgerRef={React.createRef<HTMLButtonElement>()}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        }}
      />
    </div>
  );
};

export default RoleBasedLayout;