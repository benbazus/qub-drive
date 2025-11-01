import React from 'react';
import { 
  HardDrive, 
  Upload, 
  Download, 
  Star, 
  Clock, 
  Users, 
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@tanstack/react-router';

interface UserDashboardProps {
  className?: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ className }) => {
  // Mock data - replace with real data from your API
  const storageUsed = 2.4; // GB
  const storageTotal = 15; // GB
  const storagePercentage = (storageUsed / storageTotal) * 100;

  const recentFiles = [
    { id: '1', name: 'Project Proposal.docx', type: 'document', lastModified: '2 hours ago', size: '2.4 MB' },
    { id: '2', name: 'Budget Spreadsheet.xlsx', type: 'spreadsheet', lastModified: '1 day ago', size: '1.8 MB' },
    { id: '3', name: 'Team Photo.jpg', type: 'image', lastModified: '3 days ago', size: '4.2 MB' },
    { id: '4', name: 'Meeting Notes.pdf', type: 'pdf', lastModified: '1 week ago', size: '856 KB' }
  ];

  const quickStats = [
    { label: 'Total Files', value: '247', icon: FileText, change: '+12 this week' },
    { label: 'Shared Files', value: '18', icon: Users, change: '+3 this week' },
    { label: 'Starred Items', value: '32', icon: Star, change: '+5 this week' },
    { label: 'Recent Activity', value: '15', icon: Activity, change: 'Today' }
  ];

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your files today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dashboard/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/create-document">
              <FileText className="h-4 w-4 mr-2" />
              New Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>
              {storageUsed} GB of {storageTotal} GB used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={storagePercentage} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{storageUsed} GB used</span>
              <span>{(storageTotal - storageUsed).toFixed(1)} GB free</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/dashboard/settings/storage">
                Manage Storage
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Files */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Files
              </CardTitle>
              <CardDescription>
                Files you've worked on recently
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/drive/recent">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {file.lastModified} • {file.size}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {file.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/dashboard/upload">
                <Upload className="h-6 w-6" />
                <span>Upload Files</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/dashboard/create-folder">
                <HardDrive className="h-6 w-6" />
                <span>Create Folder</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/dashboard/drive/shared-with-me">
                <Users className="h-6 w-6" />
                <span>Shared Files</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/dashboard/drive/starred">
                <Star className="h-6 w-6" />
                <span>Starred Items</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;