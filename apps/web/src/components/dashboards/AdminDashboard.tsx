import React from 'react';
import { 
  Users, 
  HardDrive, 
  Activity, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Database,
  UserPlus,
  Settings,
  BarChart3,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@tanstack/react-router';

interface AdminDashboardProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  // Mock data - replace with real data from your API
  const systemStats = [
    { label: 'Total Users', value: '1,247', icon: Users, change: '+23 this month', trend: 'up' },
    { label: 'Storage Used', value: '2.4 TB', icon: HardDrive, change: '+180 GB this week', trend: 'up' },
    { label: 'Active Sessions', value: '89', icon: Activity, change: '+12 from yesterday', trend: 'up' },
    { label: 'System Health', value: '98.5%', icon: Shield, change: 'All systems operational', trend: 'stable' }
  ];

  const recentActivity = [
    { id: '1', user: 'John Doe', action: 'Created new folder', time: '2 minutes ago', type: 'create' },
    { id: '2', user: 'Jane Smith', action: 'Shared document with team', time: '15 minutes ago', type: 'share' },
    { id: '3', user: 'Mike Johnson', action: 'Uploaded 5 files', time: '1 hour ago', type: 'upload' },
    { id: '4', user: 'Sarah Wilson', action: 'Modified user permissions', time: '2 hours ago', type: 'admin' }
  ];

  const storageByDepartment = [
    { name: 'Engineering', used: 45, total: 100, percentage: 45 },
    { name: 'Marketing', used: 32, total: 50, percentage: 64 },
    { name: 'Sales', used: 28, total: 75, percentage: 37 },
    { name: 'HR', used: 15, total: 25, percentage: 60 }
  ];

  const alerts = [
    { id: '1', type: 'warning', message: 'Marketing team approaching storage limit', time: '1 hour ago' },
    { id: '2', type: 'info', message: 'System backup completed successfully', time: '3 hours ago' },
    { id: '3', type: 'warning', message: '5 users haven\'t logged in for 30+ days', time: '1 day ago' }
  ];

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your organization's file system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dashboard/admin/users/create">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => {
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
                    <p className={`text-xs mt-1 ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                      stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest user actions across the system
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analytics/activity">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      activity.type === 'create' ? 'bg-green-100 dark:bg-green-900' :
                      activity.type === 'share' ? 'bg-blue-100 dark:bg-blue-900' :
                      activity.type === 'upload' ? 'bg-purple-100 dark:bg-purple-900' :
                      'bg-orange-100 dark:bg-orange-900'
                    }`}>
                      {activity.type === 'create' && <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {activity.type === 'share' && <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {activity.type === 'upload' && <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      {activity.type === 'admin' && <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Storage by Department
            </CardTitle>
            <CardDescription>
              Storage usage across different teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageByDepartment.map((dept, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {dept.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {dept.used} GB / {dept.total} GB
                  </span>
                </div>
                <Progress value={dept.percentage} className="h-2" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link to="/dashboard/analytics/storage">
                View Detailed Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Important notifications requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                  'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                        'text-blue-800 dark:text-blue-200'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.time}
                      </p>
                    </div>
                    <Badge variant={alert.type === 'warning' ? 'destructive' : 'default'} className="text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                <Link to="/dashboard/admin/users">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Users</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                <Link to="/dashboard/analytics">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">View Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                <Link to="/dashboard/admin/storage">
                  <Database className="h-6 w-6" />
                  <span className="text-sm">Storage Management</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                <Link to="/dashboard/admin/settings">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">System Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;