import React, { useState, useEffect, useRef } from 'react'
import { Cloud, Upload, HardDrive, Users, Star, Clock, Trash2, ChevronRight, Folder, FileText, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, useLocation } from '@tanstack/react-router'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { StorageCard } from '../../features/dashboard/components/StorageCard'
import { EnhancedButtonAction } from '../EnhancedButtonAction'
import { useFileOperations } from '@/hooks/useFileOperations'
import { useAuthStore } from '@/stores/authStore'
import { EnhancedNavigation } from './EnhancedNavigation'
import { UserRole } from '@packages/shared-types'




type NavItem = {
  icon: React.ElementType
  label: string
  href: string
  badge?: string
}

interface SidebarProps {

  setCurrentView: (view: any) => void
  setCurrentPath: (path: any) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

// Hook to detect screen size and touch capabilities
function useResponsiveFeatures() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    handleResize();
    checkTouchDevice();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isTouchDevice,
    screenSize
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  isOpen = false,
  onClose
}) => {
  const location = useLocation();
  const { isMobile: detectedMobile, isTouchDevice } = useResponsiveFeatures();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Use detected mobile state if not provided
  const actualIsMobile = isMobile || detectedMobile;

  // File operations hook
  const {
    triggerFileUpload,
    promptCreateFolder,
    promptCreateDocument,
  } = useFileOperations();

  // Handler functions for upload dropdown
  const handleCreateFolder = () => {
    promptCreateFolder();
  };

  const handleUploadFile = () => {
    triggerFileUpload();
  };

  const handleCreateDocument = () => {
    promptCreateDocument();
  };

  const handleUpgradeStorage = () => {
    // window.open('https://your-app.com/subscription-plans', '_blank');
  };

  // Touch gesture handlers for mobile swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!actualIsMobile || !isOpen) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!actualIsMobile || !isOpen) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!actualIsMobile || !isOpen || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;

    // Close sidebar on left swipe (swipe left to close)
    if (isLeftSwipe && onClose) {
      onClose();
    }
  };

  // Close sidebar when clicking on navigation items on mobile
  const handleNavItemClick = () => {
    if (actualIsMobile && isOpen && onClose) {
      onClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && actualIsMobile && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actualIsMobile, isOpen, onClose]);

  const navItems: NavItem[] = [
    // { icon: HardDrive, label: 'Test Page', href: '/dashboard/drive/Test' },
    // { icon: HardDrive, label: 'Spreadsheet', href: '/spreadsheet' },
    { icon: HardDrive, label: 'Home', href: '/dashboard/drive/home' },
    { icon: HardDrive, label: 'My Files', href: '/dashboard/drive/my-drive' },
    { icon: Users, label: 'Shared', href: '/dashboard/drive/shared-with-me' },
    { icon: Star, label: 'Starred', href: '/dashboard/drive/starred' },
    { icon: Clock, label: 'Recent', href: '/dashboard/drive/recent' },
    { icon: Trash2, label: 'Trash', href: '/dashboard/drive/trash' },
  //  { icon: Trash2, label: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'flex h-full flex-col relative transition-all duration-300 ease-in-out',
        // Responsive padding
        'p-3 sm:p-4 lg:p-5',
        // Mobile-specific styles
        actualIsMobile && 'touch-pan-y',
        // Smooth animations
        'will-change-transform'
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Close Button */}
      {actualIsMobile && isOpen && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2 transition-all duration-200 hover:scale-110 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className='h-4 w-4 text-gray-600 dark:text-gray-400' />
        </button>
      )}

      {/* Collapse Toggle Button - Desktop only */}
      {!actualIsMobile && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            "absolute -right-3 top-6 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110",
            "hidden lg:block" // Only show on desktop
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className={cn(
            'h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-300',
            isCollapsed && 'rotate-180'
          )} />
        </button>
      )}

      {/* Logo - Enhanced Responsive */}
      <div className={cn(
        'mb-4 sm:mb-6 lg:mb-8 flex items-center p-2 transition-all duration-300',
        isCollapsed && !actualIsMobile ? 'justify-center space-x-0' : 'space-x-3',
        // Mobile always shows full logo when open
        actualIsMobile && 'justify-start space-x-3'
      )}>
        <div className={cn(
          'bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300',
          // Responsive logo sizes
          'h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10',
          // Hover effects for touch devices
          isTouchDevice && 'active:scale-95'
        )}>
          <Cloud className={cn(
            'text-white transition-all duration-300',
            'h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6'
          )} />
        </div>
        {(!isCollapsed || actualIsMobile) && (
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300',
            // Responsive text sizes
            'text-base sm:text-lg lg:text-xl',
            // Ensure text doesn't overflow on small screens
            'truncate max-w-[150px] sm:max-w-none'
          )}>
            Qub Drive
          </h1>
        )}
      </div>

      <div className={cn(
        'flex-1 transition-all duration-300',
        // Responsive spacing
        'space-y-3 sm:space-y-4 lg:space-y-6',
        // Ensure proper scrolling on mobile
        'overflow-y-auto overscroll-contain'
      )}>
        {/* Upload Button with Dropdown - Enhanced Responsive */}
        {(!isCollapsed || actualIsMobile) ? (
          <div className="px-1">
            <EnhancedButtonAction />
          </div>
        ) : (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200',
                    // Responsive button sizes
                    'p-2 sm:p-2.5 lg:p-3',
                    // Touch-friendly interactions
                    isTouchDevice ? 'active:scale-95' : 'hover:scale-105',
                    // Focus styles for accessibility
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
                  )}
                  aria-label="Upload options"
                >
                  <Upload className='h-4 w-4 sm:h-5 sm:w-5' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='start'
                className={cn(
                  'w-56',
                  // Mobile-specific dropdown positioning
                  actualIsMobile && 'ml-2'
                )}
              >
                <DropdownMenuItem onClick={handleCreateFolder}>
                  <Folder className='mr-3 h-4 w-4 text-blue-500' />
                  Create Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUploadFile}>
                  <Upload className='mr-3 h-4 w-4 text-green-500' />
                  Upload File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateDocument}>
                  <FileText className='mr-3 h-4 w-4 text-purple-500' />
                  Create Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation - Enhanced Responsive */}
        <nav className={cn(
          'transition-all duration-300',
          // Responsive spacing
          'space-y-1 sm:space-y-1.5 lg:space-y-2'
        )}>
          {navItems.map((item, _index) => {
            const isActive = location.pathname === item.href;
            return (
              <div key={item.label} className="relative group">
                <Link
                  to={item.href}
                  onClick={handleNavItemClick}
                  className={cn(
                    'flex w-full items-center rounded-xl text-left font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                    // Responsive padding and text sizes
                    'px-3 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3',
                    'text-sm sm:text-sm lg:text-base',
                    // Layout based on collapsed state and mobile
                    (isCollapsed && !actualIsMobile) ? 'justify-center' : 'gap-3 sm:gap-3 lg:gap-4',
                    // Touch-friendly interactions
                    isTouchDevice ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]',
                    // Active and inactive states
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/5 border border-blue-200/50 dark:border-blue-800/50'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border border-transparent',
                    // Mobile-specific styles
                    actualIsMobile && 'min-h-[44px]' // Minimum touch target size
                  )}
                  aria-label={item.label}
                >
                  <item.icon className={cn(
                    'flex-shrink-0 transition-all duration-200',
                    // Responsive icon sizes
                    'h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5',
                    // Icon color animation
                    isActive && 'text-blue-600 dark:text-blue-400'
                  )} />
                  {(!isCollapsed || actualIsMobile) && (
                    <>
                      <span className={cn(
                        "flex-1 transition-all duration-200",
                        // Prevent text overflow
                        "truncate"
                      )}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={cn(
                          "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold rounded-full transition-all duration-200",
                          // Responsive badge sizes
                          "text-xs px-2 py-0.5 sm:px-2 sm:py-1"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Enhanced Tooltip for collapsed state */}
                {isCollapsed && !actualIsMobile && (
                  <div className={cn(
                    "absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg transition-all duration-200 whitespace-nowrap z-50 pointer-events-none",
                    "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                    "shadow-lg border border-gray-700 dark:border-gray-600",
                    // Hide on touch devices to prevent interference
                    isTouchDevice && "hidden"
                  )}>
                    <div className="flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 border-l border-b border-gray-700 dark:border-gray-600"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Enhanced Role-Based Navigation */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <EnhancedNavigation
            userRole={(useAuthStore.getState().user?.role?.[0] || 'user') as UserRole}
            isCollapsed={isCollapsed && !actualIsMobile}
            onItemClick={handleNavItemClick}
          />
        </div>
      </div>

      {/* Storage Card - Enhanced Responsive */}
      <div className={cn(
        "mt-auto transition-all duration-300",
        // Responsive spacing
        "pt-3 sm:pt-4 lg:pt-6"
      )}>
        {(!isCollapsed || actualIsMobile) ? (
          <div className="px-1">
            <StorageCard onUpgrade={handleUpgradeStorage} />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="relative group">
              <button
                onClick={handleUpgradeStorage}
                className={cn(
                  "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                  // Responsive button sizes
                  "p-2 sm:p-2.5 lg:p-3",
                  // Touch-friendly interactions
                  isTouchDevice ? 'active:scale-95' : 'hover:scale-105'
                )}
                aria-label="Upgrade storage"
              >
                <Zap className='h-4 w-4 sm:h-5 sm:w-5' />
              </button>

              {/* Enhanced Tooltip for collapsed storage */}
              {!actualIsMobile && !isTouchDevice && (
                <div className={cn(
                  "absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg transition-all duration-200 whitespace-nowrap z-50 pointer-events-none",
                  "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                  "shadow-lg border border-gray-700 dark:border-gray-600"
                )}>
                  Upgrade Storage
                  {/* Tooltip arrow */}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 border-l border-b border-gray-700 dark:border-gray-600"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile swipe indicator */}
      {actualIsMobile && isOpen && (
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full">
          <div className="w-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-l-full opacity-50"></div>
        </div>
      )}
    </div>
  )
}