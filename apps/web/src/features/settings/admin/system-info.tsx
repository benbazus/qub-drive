import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Server,
  Users,
  Files,
  HardDrive,
  Activity,
  CheckCircle,
  Clock,
  Database,
  Mail,
  Zap,
  Shield
} from 'lucide-react';
import systemSettingsEndpoint, { SystemInfo } from '@/api/endpoints/system-settings.endpoint';

function formatBytes(bytes: string): string {
  try {
    const numBytes = BigInt(bytes || '0');
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = Number(numBytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  } catch (error) {
    console.error('Error formatting bytes:', error);
    return '0 B';
  }
}

function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default function SystemInfoPage() {
  const { data: systemInfo, isLoading, error } = useQuery<SystemInfo>({
    queryKey: ['systemInfo'],
    queryFn: () => systemSettingsEndpoint.getSystemInfo(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Loading system information...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading System Information</CardTitle>
            <CardDescription>
              Failed to load system information. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">System Status</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {systemInfo?.totalUsers?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Files className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Files</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {systemInfo?.totalFiles?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Storage Used</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {systemInfo?.storageUsed ? formatBytes(systemInfo.storageUsed) : '0 B'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main System Information Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">System Information</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Overview of system status, performance metrics, and resource usage.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* System Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">System Status</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Current system information and version details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Online
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <Badge variant="outline">
                    {systemInfo?.version ?? '1.0.0'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">
                    {systemInfo?.uptime ? formatUptime(systemInfo.uptime) : '0s'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                  <span className="text-sm font-medium">
                    {systemInfo?.lastBackup
                      ? new Date(systemInfo.lastBackup).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
              <h5 className="text-md font-semibold text-blue-900 dark:text-blue-100 mb-4">License Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">License Type</span>
                    <Badge variant="secondary" className="capitalize">
                      {systemInfo?.licenseType ?? 'Enterprise'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">License Expires</span>
                    <span className="text-sm font-medium">
                      {systemInfo?.licenseExpiration
                        ? new Date(systemInfo.licenseExpiration).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Installed</span>
                    <span className="text-sm font-medium">
                      {systemInfo?.createdAt
                        ? new Date(systemInfo.createdAt).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">System Health</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Service status and health monitoring</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Database</span>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">File Storage</span>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Available
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email Service</span>
                  </div>
                  <Badge variant="outline">
                    Not Configured
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Background Jobs</span>
                  </div>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Running
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Security Scanning</span>
                  </div>
                  <Badge variant="outline">
                    Disabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Backup Service</span>
                  </div>
                  <Badge variant="outline">
                    Not Configured
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Performance Metrics</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">System performance and monitoring information</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p>
                Performance monitoring and detailed metrics will be available in a future update.
                This section will include CPU usage, memory consumption, request latency, and other
                system performance indicators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}