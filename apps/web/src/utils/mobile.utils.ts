/**
 * Mobile utility functions for responsive design
 */

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if the current screen size matches a breakpoint
 */
export const isBreakpoint = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
};

/**
 * Check if device is mobile based on screen size
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if device is tablet based on screen size
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Check if device is desktop based on screen size
 */
export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get responsive grid columns based on screen size
 */
export const getResponsiveGridCols = (
  mobile: number = 2,
  tablet: number = 3,
  desktop: number = 4,
  large: number = 5
): number => {
  if (typeof window === 'undefined') return desktop;
  
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.sm) return mobile;
  if (width < BREAKPOINTS.md) return mobile;
  if (width < BREAKPOINTS.lg) return tablet;
  if (width < BREAKPOINTS.xl) return desktop;
  return large;
};

/**
 * Get responsive padding classes
 */
export const getResponsivePadding = (
  mobile: string = 'p-3',
  tablet: string = 'sm:p-4',
  desktop: string = 'lg:p-6'
): string => {
  return `${mobile} ${tablet} ${desktop}`;
};

/**
 * Get responsive text size classes
 */
export const getResponsiveTextSize = (
  mobile: string = 'text-sm',
  tablet: string = 'sm:text-base',
  desktop: string = 'lg:text-lg'
): string => {
  return `${mobile} ${tablet} ${desktop}`;
};

/**
 * Get responsive spacing classes
 */
export const getResponsiveSpacing = (
  mobile: string = 'space-y-2',
  tablet: string = 'sm:space-y-3',
  desktop: string = 'lg:space-y-4'
): string => {
  return `${mobile} ${tablet} ${desktop}`;
};

/**
 * Debounce function for resize events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Hook for responsive behavior
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  React.useEffect(() => {
    const handleResize = debounce(() => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    isMobile: screenSize.width < BREAKPOINTS.md,
    isTablet: screenSize.width >= BREAKPOINTS.md && screenSize.width < BREAKPOINTS.lg,
    isDesktop: screenSize.width >= BREAKPOINTS.lg,
    isTouch: isTouchDevice(),
  };
};

// Import React for the hook
import React from 'react';