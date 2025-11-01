import { createFileRoute } from '@tanstack/react-router';
import { useRoleDashboardStats } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, HardDrive, Upload, Download, Share2, FileText, TrendingUp } from 'lucide-react';
import { formatBytes, formatNumber } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useRoleDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of users, content, and system activity
        </p>
      </div>

      {/* User Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.users.totalUsers || 0)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats?.users.newUsersThisWeek || 0} this week
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.users.totalUsers ? ((stats.users.activeUsers / stats.users.totalUsers) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.storage.totalFiles || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg size: {formatBytes(stats?.storage.averageFileSize || 0)}
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.storage.totalStorage ? ((stats.storage.usedStorage / stats.storage.totalStorage) * 100).toFixed(1) : 0}% used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads Today</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.activity.uploadsToday || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(stats?.activity.uploadsThisWeek || 0)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads Today</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.activity.downloadsToday || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(stats?.activity.downloadsThisWeek || 0)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares Today</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.activity.sharesToday || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(stats?.activity.sharesThisWeek || 0)} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Login activity over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Active Users:</span>
              <span className="font-semibold">{formatNumber(stats?.activity.dailyActiveUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Weekly Active Users:</span>
              <span className="font-semibold">{formatNumber(stats?.activity.weeklyActiveUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Active Users:</span>
              <span className="font-semibold">{formatNumber(stats?.activity.monthlyActiveUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm text-muted-foreground">Total Logins This Month:</span>
              <span className="font-semibold">{formatNumber(stats?.activity.loginsThisMonth || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>Users by role and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Verified Users:</span>
              <span className="font-semibold">{formatNumber(stats?.users.verifiedUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unverified Users:</span>
              <span className="font-semibold text-orange-600">{formatNumber(stats?.users.unverifiedUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Locked Accounts:</span>
              <span className="font-semibold text-red-600">{formatNumber(stats?.users.lockedUsers || 0)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm text-muted-foreground">New Users This Month:</span>
              <span className="font-semibold text-green-600">{formatNumber(stats?.users.newUsersThisMonth || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Storage Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Storage Users</CardTitle>
          <CardDescription>Users consuming the most storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.storage.storageByUser.slice(0, 10).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatBytes(user.storageUsed)}</p>
                  <p className="text-xs text-muted-foreground">{user.percentageUsed.toFixed(1)}% of quota</p>
                </div>
              </div>
            ))}
            {(!stats?.storage.storageByUser || stats.storage.storageByUser.length === 0) && (
              <p className="text-sm text-muted-foreground">No storage data available</p>
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
            {stats?.activity.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={activity.id || index} className="flex items-start justify-between border-b pb-2 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.fullName} ({activity.userEmail})
                  </p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
            {(!stats?.activity.recentActivity || stats.activity.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
