import React from 'react';
import { 
  Shield, 
  Server, 
  Database, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  HardDrive,
  Zap,
  Lock,
  Globe,
  Settings,
  Archive,
  Key,
  UserCheck,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@tanstack/react-router';

interface SuperAdminDashboardProps {
  className?: string;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ className }) => {
  // Mock data - replace with real data from your API
  const systemMetrics = [
    { label: 'System Uptime', value: '99.98%', icon: Server, change: '30 days', trend: 'stable', status: 'healthy' },
    { label: 'Total Organizations', value: '47', icon: Globe, change: '+3 this month', trend: 'up', status: 'healthy' },
    { label: 'Database Health', value: '98.5%', icon: Database, change: 'Optimal', trend: 'stable', status: 'healthy' },
    { label: 'Security Score', value: '94/100', icon: Shield, change: '+2 this week', trend: 'up', status: 'warning' }
  ];

  const systemServices = [
    { name: 'Authentication Service', status: 'healthy', uptime: '99.99%', lastCheck: '2 min ago' },
    { name: 'File Storage Service', status: 'healthy', uptime: '99.95%', lastCheck: '1 min ago' },
    { name: 'Database Cluster', status: 'healthy', uptime: '99.98%', lastCheck: '30 sec ago' },
    { name: 'Backup Service', status: 'warning', uptime: '98.2%', lastCheck: '5 min ago' },
    { name: 'CDN Network', status: 'healthy', uptime: '99.99%', lastCheck: '1 min ago' },
    { name: 'Email Service', status: 'degraded', uptime: '95.1%', lastCheck: '10 min ago' }
  ];

  const securityAlerts = [
    { id: '1', severity: 'high', message: 'Multiple failed login attempts detected', time: '15 min ago', resolved: false },
    { id: '2', severity: 'medium', message: 'SSL certificate expires in 30 days', time: '2 hours ago', resolved: false },
    { id: '3', severity: 'low', message: 'Unusual API usage pattern detected', time: '1 day ago', resolved: true },
    { id: '4', severity: 'medium', message: 'Backup verification failed for org-47', time: '2 days ago', resolved: false }
  ];

  const resourceUsage = [
    { name: 'CPU Usage', current: 45, max: 100, unit: '%', status: 'normal' },
    { name: 'Memory Usage', current: 68, max: 100, unit: '%', status: 'normal' },
    { name: 'Storage Usage', current: 2.4, max: 10, unit: 'TB', status: 'normal' },
    { name: 'Network I/O', current: 1.2, max: 5, unit: 'Gbps', status: 'normal' }
  ];

  const recentSystemEvents = [
    { id: '1', type: 'system', event: 'Database backup completed', time: '30 min ago', severity: 'info' },
    { id: '2', type: 'security', event: 'New admin user created', time: '2 hours ago', severity: 'warning' },
    { id: '3', type: 'system', event: 'SSL certificate renewed', time: '1 day ago', severity: 'info' },
    { id: '4', type: 'performance', event: 'High CPU usage alert resolved', time: '2 days ago', severity: 'success' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'degraded': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            System-wide monitoring and management console.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" asChild>
            <Link to="/dashboard/system/emergency">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Actions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/system/settings">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className={`hover:shadow-md transition-shadow ${
              metric.status === 'warning' ? 'border-yellow-200 dark:border-yellow-800' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metric.value}
                    </p>
                    <p className={`text-xs mt-1 ${
                      metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                      metric.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {metric.change}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    metric.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      metric.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Services Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Services
              </CardTitle>
              <CardDescription>
                Real-time status of critical services
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/system/services">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {service.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Uptime: {service.uptime} • Last check: {service.lastCheck}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    service.status === 'healthy' ? 'default' : 
                    service.status === 'warning' ? 'secondary' : 'destructive'
                  } className="text-xs">
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>
                Critical security notifications
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/security/alerts">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {alert.message}
                        </p>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.time}
                      </p>
                    </div>
                    <Badge variant={
                      alert.severity === 'high' ? 'destructive' : 
                      alert.severity === 'medium' ? 'secondary' : 'default'
                    } className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage and Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resource Usage
            </CardTitle>
            <CardDescription>
              Current system resource utilization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resourceUsage.map((resource, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {resource.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {resource.current} {resource.unit} / {resource.max} {resource.unit}
                  </span>
                </div>
                <Progress 
                  value={(resource.current / resource.max) * 100} 
                  className={`h-2 ${
                    (resource.current / resource.max) > 0.8 ? 'bg-red-100' : 
                    (resource.current / resource.max) > 0.6 ? 'bg-yellow-100' : 'bg-green-100'
                  }`} 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent System Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent System Events
              </CardTitle>
              <CardDescription>
                Latest system-wide activities
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/system/events">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSystemEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      event.severity === 'success' ? 'bg-green-100 dark:bg-green-900' :
                      event.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      event.severity === 'error' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {event.type === 'system' && <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {event.type === 'security' && <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                      {event.type === 'performance' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {event.event}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    event.severity === 'success' ? 'default' :
                    event.severity === 'warning' ? 'secondary' :
                    event.severity === 'error' ? 'destructive' : 'outline'
                  } className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Actions */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">Critical System Actions</CardTitle>
          <CardDescription>
            High-privilege operations requiring super admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-red-200 hover:bg-red-50" asChild>
              <Link to="/dashboard/system/users">
                <UserCheck className="h-6 w-6 text-red-600" />
                <span className="text-sm">Manage Admins</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-red-200 hover:bg-red-50" asChild>
              <Link to="/dashboard/system/backups">
                <Archive className="h-6 w-6 text-red-600" />
                <span className="text-sm">System Backups</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-red-200 hover:bg-red-50" asChild>
              <Link to="/dashboard/system/api-keys">
                <Key className="h-6 w-6 text-red-600" />
                <span className="text-sm">API Keys</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 border-red-200 hover:bg-red-50" asChild>
              <Link to="/dashboard/system/maintenance">
                <Zap className="h-6 w-6 text-red-600" />
                <span className="text-sm">Maintenance</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;