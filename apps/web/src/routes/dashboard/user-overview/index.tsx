import { createFileRoute, Link } from '@tanstack/react-router';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Upload, Download, Share2, HardDrive, Clock, Star, FolderOpen } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/user-overview/')({
  component: UserDashboard,
});

function UserDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

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
        <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your files and activity
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalFiles.growth > 0 ? '+' : ''}{stats?.totalFiles.growth?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats?.storageUsed.bytes || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.storageUsed.growth > 0 ? '+' : ''}{stats?.storageUsed.growth?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Files</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sharedFiles.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.sharedFiles.growth > 0 ? '+' : ''}{stats?.sharedFiles.growth?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamMembers.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.teamMembers.growth > 0 ? '+' : ''}{stats?.teamMembers.growth?.toFixed(1) || 0}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/dashboard/drive/my-drive">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="mr-2 h-4 w-4" />
                My Drive
              </Button>
            </Link>
            <Link to="/dashboard/drive/recent">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Recent Files
              </Button>
            </Link>
            <Link to="/dashboard/drive/shared-with-me">
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="mr-2 h-4 w-4" />
                Shared with Me
              </Button>
            </Link>
            <Link to="/dashboard/drive/starred">
              <Button variant="outline" className="w-full justify-start">
                <Star className="mr-2 h-4 w-4" />
                Starred
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>Your storage usage and quota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">{formatBytes(stats?.storageUsed.bytes || 0)} of 10 GB</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${Math.min(100, ((stats?.storageUsed.bytes || 0) / (10 * 1024 * 1024 * 1024)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats?.storageUsed.bytes || 0) / (10 * 1024 * 1024 * 1024) * 100).toFixed(1)}% of your storage is used
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" size="sm">
              View Storage Details
            </Button>
            <Button variant="default" size="sm">
              Upgrade Storage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent file operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Uploaded "Project Report.pdf"</span>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Shared "Design Mockups" folder</span>
                </div>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Downloaded "Meeting Notes.docx"</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips & Suggestions</CardTitle>
            <CardDescription>Get more out of your storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
              <Star className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Star important files</p>
                <p className="text-xs text-muted-foreground">Keep your most important files easily accessible</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
              <Share2 className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Share with your team</p>
                <p className="text-xs text-muted-foreground">Collaborate on files and folders in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
              <HardDrive className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Manage your storage</p>
                <p className="text-xs text-muted-foreground">Review and delete unused files to free up space</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
