import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useResponsive } from '@/utils/mobile.utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  TouchpadIcon as Touch,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

export const MobileTestPage: React.FC = () => {
  const isMobile = useIsMobile();
  const responsive = useResponsive();

  const deviceInfo = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown',
    cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    onLine: typeof navigator !== 'undefined' ? navigator.onLine : false,
  };

  const getDeviceIcon = () => {
    if (responsive.isMobile) return Smartphone;
    if (responsive.isTablet) return Tablet;
    return Monitor;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Mobile Responsiveness Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Testing mobile-friendly features and responsive design
          </p>
        </div>

        {/* Device Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DeviceIcon className="h-5 w-5" />
              Device Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant={responsive.isMobile ? "default" : "secondary"}>
                  Mobile
                </Badge>
                <p className="text-xs mt-1">{responsive.isMobile ? 'Yes' : 'No'}</p>
              </div>
              <div className="text-center">
                <Badge variant={responsive.isTablet ? "default" : "secondary"}>
                  Tablet
                </Badge>
                <p className="text-xs mt-1">{responsive.isTablet ? 'Yes' : 'No'}</p>
              </div>
              <div className="text-center">
                <Badge variant={responsive.isDesktop ? "default" : "secondary"}>
                  Desktop
                </Badge>
                <p className="text-xs mt-1">{responsive.isDesktop ? 'Yes' : 'No'}</p>
              </div>
              <div className="text-center">
                <Badge variant={responsive.isTouch ? "default" : "secondary"}>
                  <Touch className="h-3 w-3 mr-1" />
                  Touch
                </Badge>
                <p className="text-xs mt-1">{responsive.isTouch ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Screen Size:</strong> {responsive.width} × {responsive.height}
              </div>
              <div>
                <strong>Hook Detection:</strong> {isMobile ? 'Mobile' : 'Desktop'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch Targets Test */}
        <Card>
          <CardHeader>
            <CardTitle>Touch Targets Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Button size="sm" className="h-8">Small (32px)</Button>
              <Button size="default" className="h-10">Default (40px)</Button>
              <Button size="lg" className="h-12">Large (48px)</Button>
              <Button size="mobile" className="h-12">Mobile (48px)</Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Recommended minimum touch target size is 44px × 44px
            </p>
          </CardContent>
        </Card>

        {/* Responsive Grid Test */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Grid Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-lg text-center font-medium"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Typography Test */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scaling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
              Responsive Heading
            </h1>
            <p className="text-sm sm:text-base md:text-lg">
              This paragraph scales with screen size for optimal readability.
            </p>
            <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              Small text that remains legible on all devices.
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Platform:</strong> {deviceInfo.platform}
              </div>
              <div>
                <strong>Language:</strong> {deviceInfo.language}
              </div>
              <div className="flex items-center gap-2">
                <strong>Online:</strong> 
                <Wifi className={`h-4 w-4 ${deviceInfo.onLine ? 'text-green-500' : 'text-red-500'}`} />
                {deviceInfo.onLine ? 'Yes' : 'No'}
              </div>
              <div className="flex items-center gap-2">
                <strong>Cookies:</strong>
                <Battery className={`h-4 w-4 ${deviceInfo.cookieEnabled ? 'text-green-500' : 'text-red-500'}`} />
                {deviceInfo.cookieEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className="mt-4">
              <strong>User Agent:</strong>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                {deviceInfo.userAgent}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-specific Features */}
        {responsive.isMobile && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">
                Mobile-Specific Features Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Touch-optimized interface</li>
                <li>✅ Larger touch targets (44px minimum)</li>
                <li>✅ Mobile-friendly navigation</li>
                <li>✅ Responsive typography</li>
                <li>✅ Optimized spacing and padding</li>
                <li>✅ Mobile-first grid layout</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};