import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileFloatingActions } from "../MobileFloatingActions";
import { useFileOperations } from "@/hooks/useFileOperations";

import { FolderProvider } from "@/context/folder-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Hook to detect screen size
function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
}

export const DashboardLayout = ({
  children,
  className,
}: DashboardLayoutProps) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    isMobile || isTablet
  );

  const sidebarRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const isTogglingRef = useRef(false);

  // File operations hook
  const { triggerFileUpload, promptCreateFolder, promptCreateDocument } =
    useFileOperations();

  // Auto-collapse sidebar on mobile and tablet
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    } else if (isTablet) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, isTablet]);

  // Enhanced sidebar open function
  const handleSidebarOpen = () => {
    isTogglingRef.current = true;
    setSidebarOpen(true);

    // Reset toggling flag after animation
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 300);
  };

  // Enhanced sidebar close function
  const handleSidebarClose = () => {
    if (isTogglingRef.current) return;
    setSidebarOpen(false);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return;

    const handleClickOutside = (event: Event) => {
      if (isTogglingRef.current) return;

      const target = event.target as Element;

      // Don't close if clicking on sidebar or hamburger button
      if (
        (sidebarRef.current && sidebarRef.current.contains(target)) ||
        (hamburgerRef.current && hamburgerRef.current.contains(target))
      ) {
        return;
      }

      handleSidebarClose();
    };

    // Add event listeners with a delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("touchstart", handleClickOutside, {
        passive: true,
      });
      document.addEventListener("mousedown", handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <FolderProvider>
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white flex h-screen w-full overflow-hidden">
        {/* Sidebar Overlay - Enhanced for better mobile experience */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300",
            isSidebarOpen
              ? "opacity-100 visible"
              : "pointer-events-none opacity-0 invisible",
            "lg:hidden" // Only show overlay on mobile/tablet
          )}
          onClick={handleSidebarClose}
        />

        {/* Sidebar - Fully responsive */}
        <aside
          ref={sidebarRef}
          className={cn(
            "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl transition-all duration-300 ease-in-out",
            // Mobile styles
            "fixed top-0 left-0 z-50 h-full lg:relative lg:translate-x-0",
            // Width based on collapsed state
            isSidebarCollapsed ? "w-20" : "w-72",
            // Mobile visibility
            isMobile
              ? isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0",
            // Tablet and desktop behavior
            !isMobile && isSidebarCollapsed && "lg:w-20",
            !isMobile && !isSidebarCollapsed && "lg:w-72"
          )}
        >
          <Sidebar
            setCurrentView={() => {}} // Will be handled by parent component
            setCurrentPath={() => {}} // Will be handled by parent component
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => {
              setSidebarCollapsed(!isSidebarCollapsed);
              // Close mobile sidebar when toggling collapse
              if (isMobile) {
                handleSidebarClose();
              }
            }}
            isMobile={isMobile}
            isOpen={isSidebarOpen}
            onClose={handleSidebarClose}
          />
        </aside>

        {/* Main Content Area - Responsive */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all duration-300",
            isMobile
              ? "ml-0"
              : isSidebarCollapsed
                ? "ml-0 lg:ml-0"
                : "ml-0 lg:ml-0"
          )}
        >
          {/* Header - Responsive */}
          <AdminHeader
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={handleSidebarOpen}
            hamburgerRef={hamburgerRef}
          />

          {/* Content Area - Responsive */}
          <main
            className={cn(
              "flex-1 overflow-auto",
              // Responsive padding
              "px-4 py-4 sm:px-6 lg:px-8",
              // Smooth transitions
              "transition-all duration-300 ease-in-out",
              // Height calculations for mobile
              "h-[calc(100vh-5rem)]", // Subtract header height
              // Ensure proper scrolling on mobile
              "overscroll-behavior-y-contain",
              className
            )}
          >
            <div
              className={cn(
                "mx-auto max-w-full",
                // Responsive max widths
                "sm:max-w-none lg:max-w-none xl:max-w-none",
                // Ensure content doesn't get too wide on large screens
                "2xl:max-w-[1400px] 2xl:mx-auto"
              )}
            >
              {children}
            </div>

            {/* Mobile Floating Actions */}
            <MobileFloatingActions
              onUploadFile={() => {
                triggerFileUpload();
              }}
              onCreateFolder={() => {
                promptCreateFolder();
              }}
              onCreateDocument={() => {
                promptCreateDocument();
              }}
            />
          </main>
        </div>
      </div>
    </FolderProvider>
  );
};
