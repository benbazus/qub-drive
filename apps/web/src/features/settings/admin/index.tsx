import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Settings,
  HardDrive,
  Mail,
  Shield,
  Share2,
  FileCheck,
  Monitor,
  RefreshCw,
  Sparkles
} from 'lucide-react';

import ContentSection from '../components/content-section';
import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';
import StorageSettings from './storage-settings';
import EmailSettings from './email-settings';
import SecuritySettings from './security-settings';
import SharingSettings from './sharing-settings';
import ComplianceSettings from './compliance-settings';
import SystemInfo from './system-info';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
//import { AdminHeader } from '@/components/layout/AdminHeader';


// Hook to detect screen size
function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}



export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('storage');
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(isMobile || isTablet);






  // Fetch system settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['systemSettings'],
    queryFn: () => systemSettingsEndpoint.getSettings(),
  });

  // Reset to defaults mutation
  const resetMutation = useMutation({
    mutationFn: () => systemSettingsEndpoint.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success('All settings have been reset to their default values.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset settings to defaults.');
    },
  });

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <ContentSection title="Admin Settings" desc="Configure system-wide settings and preferences">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-blue-500 to-purple-600"></div>
            <Settings className="absolute inset-0 m-auto h-6 w-6 text-gray-400 animate-pulse" />
          </div>
        </div>
      </ContentSection>
    );
  }



  return (
    <>
      <div className='bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white flex h-screen w-full overflow-hidden'>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300',
            isSidebarOpen ? 'opacity-100 visible' : 'pointer-events-none opacity-0 invisible',
            'lg:hidden'
          )}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={cn(
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl transition-all duration-300 ease-in-out',
            'fixed top-0 left-0 z-50 h-full lg:relative lg:translate-x-0',
            isSidebarCollapsed ? 'w-20' : 'w-72',
            'translate-x-0',
            isSidebarCollapsed && 'lg:w-20'
          )}
        >
          <Sidebar
            setCurrentView={() => { }}
            setCurrentPath={() => { }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Header - Responsive */}
        {/* <AdminHeader
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
        /> */}

        {/* Content Area - Responsive */}
        <main
          className={cn('flex-1 overflow-auto', 'px-4 py-4 sm:px-6 lg:px-8', 'transition-all duration-300 ease-in-out',
            'h-[calc(100vh-5rem)]', 'overscroll-behavior-y-contain'
          )}
        >
          <div className={cn('mx-auto max-w-full', 'sm:max-w-none lg:max-w-none xl:max-w-none', '2xl:max-w-[1400px] 2xl:mx-auto'
          )}>

            <div className="space-y-8">
              {/* Header with Action Buttons */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Configuration</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your system settings and preferences</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResetToDefaults}
                    disabled={resetMutation.isPending}
                    className="hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:border-red-200 transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${resetMutation.isPending ? 'animate-spin' : ''}`} />
                    {resetMutation.isPending ? 'Resetting...' : 'Reset to Defaults'}
                  </Button>
                </div>
              </div>

              {/* Enhanced Settings Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl border shadow-sm">
                  <TabsTrigger value="storage" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <HardDrive className="h-4 w-4" />
                    <span className="hidden sm:inline">Storage</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                  <TabsTrigger value="sharing" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Sharing</span>
                  </TabsTrigger>
                  <TabsTrigger value="compliance" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <FileCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Compliance</span>
                  </TabsTrigger>
                  <TabsTrigger value="system" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Monitor className="h-4 w-4" />
                    <span className="hidden sm:inline">System</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="storage" className="space-y-4">
                  <StorageSettings settings={settings} />
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <EmailSettings settings={settings} />
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <SecuritySettings settings={settings} />
                </TabsContent>

                <TabsContent value="sharing" className="space-y-4">
                  <SharingSettings settings={settings} />
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                  <ComplianceSettings settings={settings} />
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  <SystemInfo />
                </TabsContent>
              </Tabs>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

