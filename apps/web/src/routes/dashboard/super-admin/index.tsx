import { createFileRoute } from '@tanstack/react-router';
import { useRoleDashboardStats, useSystemHealth } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, HardDrive, Activity, Shield, TrendingUp, Server, Database, AlertTriangle } from 'lucide-react';
import { formatBytes, formatNumber } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const Route = createFileRoute('/dashboard/super-admin/')({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useRoleDashboardStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  if (statsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
            <p className="text-muted-foreground">
              Complete system overview and management controls
            </p>
          </div>

          {/* System Health Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold capitalize ${getSystemStatusColor(health?.status || 'unknown')}`}>
                  {health?.status || 'Unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {health ? formatUptime(health.uptime) : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {health?.database.status || 'Unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Response: {health?.database.responseTime || 0}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health?.performance.cpu.usage.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Load: {health?.performance.cpu.loadAverage[0].toFixed(2) || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health?.performance.memory.percentage.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {health ? formatBytes(health.performance.memory.used) : '0 B'} / {health ? formatBytes(health.serverInfo.totalMemory) : '0 B'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.users.totalUsers || 0)}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats?.users.newUsersThisMonth || 0} this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats?.users.activeUsers || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.users.totalUsers ? ((stats.users.activeUsers / stats.users.totalUsers) * 100).toFixed(1) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats?.storage.usedStorage || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.storage.totalStorage ? ((stats.storage.usedStorage / stats.storage.totalStorage) * 100).toFixed(1) : 0}% of {formatBytes(stats?.storage.totalStorage || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Threat</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold capitalize ${getThreatColor(stats?.security.threatLevel || 'low')}`}>
                  {stats?.security.threatLevel || 'Low'}
                </div>
                <div className="flex items-center text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats?.security.failedLoginsToday || 0} failed logins today
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Login statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today:</span>
                  <span className="font-semibold">{formatNumber(stats?.activity.loginsToday || 0)} logins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Week:</span>
                  <span className="font-semibold">{formatNumber(stats?.activity.loginsThisWeek || 0)} logins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Month:</span>
                  <span className="font-semibold">{formatNumber(stats?.activity.loginsThisMonth || 0)} logins</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Activity</CardTitle>
                <CardDescription>Upload & download stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uploads Today:</span>
                  <span className="font-semibold">{formatNumber(stats?.activity.uploadsToday || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Downloads Today:</span>
                  <span className="font-semibold">{formatNumber(stats?.activity.downloadsToday || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Files:</span>
                  <span className="font-semibold">{formatNumber(stats?.storage.totalFiles || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>Security metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">2FA Enabled:</span>
                  <span className="font-semibold">{stats?.security.twoFactorPercentage.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Locked Accounts:</span>
                  <span className="font-semibold">{formatNumber(stats?.security.lockedAccounts || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed Logins:</span>
                  <span className="font-semibold text-orange-600">{formatNumber(stats?.security.failedLoginsThisWeek || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.security.recentSecurityEvents.slice(0, 5).map((event, index) => (
                  <div key={event.id || index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.userEmail || 'Unknown User'} - {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className={`text-xs font-semibold capitalize ${event.severity === 'critical' ? 'text-red-600' : event.severity === 'high' ? 'text-orange-600' : event.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {event.severity}
                    </div>
                  </div>
                ))}
                {(!stats?.security.recentSecurityEvents || stats.security.recentSecurityEvents.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recent security events</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.activity.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.fullName} ({activity.userEmail}) - {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.activity.recentActivity || stats.activity.recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
