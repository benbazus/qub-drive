import React, { useState } from 'react';
import { 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Upload, 
  Plus,
  Search,
  Bell,
  HelpCircle,
  Shield,
  Users,
  BarChart3,

  FolderPlus,
  FileText,
  UserPlus,
  Database,
  Activity
} from 'lucide-react';
import { Link, useRouter } from '@tanstack/react-router';
import { useAuthUser, useLogout } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserRole } from '@packages/shared-types';
import { cn } from '@/lib/utils';

interface RoleBasedHeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: () => void;
  hamburgerRef?: React.RefObject<HTMLButtonElement>;
  userRole: UserRole;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  roles: UserRole[];
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

const RoleBasedHeader: React.FC<RoleBasedHeaderProps> = ({ 
  setSidebarOpen, 
  hamburgerRef, 
  userRole 
}) => {
  const user = useAuthUser();
  const logout = useLogout();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle logout
  const handleLogout = async () => {
    logout();
    router.navigate({ to: '/sign-in' });
  };

  // Quick actions based on user role
  const quickActions: QuickAction[] = [
    // User actions
    {
      id: 'upload-file',
      label: 'Upload',
      icon: Upload,
      action: () => router.navigate({ to: '/dashboard/upload' }),
      roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'default'
    },
    {
      id: 'create-folder',
      label: 'New Folder',
      icon: FolderPlus,
      action: () => router.navigate({ to: '/dashboard/create-folder' }),
      roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'outline'
    },
    {
      id: 'create-document',
      label: 'New Doc',
      icon: FileText,
      action: () => router.navigate({ to: '/dashboard/create-document' }),
      roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'outline'
    },

    // Manager actions
    {
      id: 'team-analytics',
      label: 'Analytics',
      icon: BarChart3,
      action: () => router.navigate({ to: '/dashboard/analytics' }),
      roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'ghost'
    },
    {
      id: 'team-activity',
      label: 'Activity',
      icon: Activity,
      action: () => router.navigate({ to: '/dashboard/analytics/activity' }),
      roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'ghost'
    },

    // Admin actions
    {
      id: 'manage-users',
      label: 'Users',
      icon: Users,
      action: () => router.navigate({ to: '/dashboard/admin/users' }),
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'secondary'
    },
    {
      id: 'add-user',
      label: 'Add User',
      icon: UserPlus,
      action: () => router.navigate({ to: '/dashboard/admin/users/create' }),
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      variant: 'outline'
    },

    // Super Admin actions
    {
      id: 'system-settings',
      label: 'System',
      icon: Shield,
      action: () => router.navigate({ to: '/dashboard/system/settings' }),
      roles: [UserRole.SUPER_ADMIN],
      variant: 'secondary',
      className: 'border-red-200 text-red-700 hover:bg-red-50'
    },
    {
      id: 'backup-management',
      label: 'Backups',
      icon: Database,
      action: () => router.navigate({ to: '/dashboard/system/backups' }),
      roles: [UserRole.SUPER_ADMIN],
      variant: 'outline'
    }
  ];

  // Filter actions based on user role
  const availableActions = quickActions.filter(action => action.roles.includes(userRole));

  // Get user display name and role badge
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userEmail = user?.email;
  
  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.SUPER_ADMIN]: { label: 'Super Admin', className: 'bg-red-100 text-red-800 border-red-200' },
      [UserRole.ADMIN]: { label: 'Admin', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      [UserRole.MANAGER]: { label: 'Manager', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      [UserRole.USER]: { label: 'User', className: 'bg-green-100 text-green-800 border-green-200' },
      [UserRole.VIEWER]: { label: 'Viewer', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      [UserRole.GUEST]: { label: 'Guest', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    };
    return roleConfig[role] || roleConfig[UserRole.USER];
  };

  const roleBadge = getRoleBadge(userRole);

  return (
    <header className='bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-30 flex h-16 sm:h-20 w-full shrink-0 items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 shadow-sm'>
      {/* Left Section */}
      <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
        {/* Mobile Menu Button */}
        <button
          ref={hamburgerRef}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSidebarOpen();
          }}
          className='lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition-colors flex-shrink-0 touch-manipulation'
          aria-label="Open sidebar"
        >
          <Menu className='h-5 w-5 sm:h-6 sm:w-6' />
        </button>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files, users, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.navigate({ 
                    to: '/dashboard/search', 
                    search: { q: searchQuery.trim() } 
                  });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Center Section - Quick Actions */}
      <div className='hidden lg:flex items-center gap-2 mx-4'>
        {availableActions.slice(0, 4).map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.action}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-all duration-200',
                action.className
              )}
            >
              <IconComponent className='h-4 w-4' />
              <span className="hidden xl:inline">{action.label}</span>
            </Button>
          );
        })}

        {/* More Actions Dropdown */}
        {availableActions.length > 4 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className='h-4 w-4' />
                <span className="hidden xl:inline ml-1">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableActions.slice(4).map((action) => {
                const IconComponent = action.icon;
                return (
                  <DropdownMenuItem key={action.id} onClick={action.action}>
                    <IconComponent className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right Section */}
      <div className='flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0'>
        {/* Notifications */}
        <button className='hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-all duration-200 hover:scale-105 relative'>
          <Bell className='text-gray-600 dark:text-gray-400 h-5 w-5' />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* Help */}
        <button className='hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-all duration-200 hover:scale-105'>
          <HelpCircle className='text-gray-600 dark:text-gray-400 h-5 w-5' />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'>
              <div className='bg-gradient-to-r from-blue-500 to-purple-600 h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0.5 shadow-lg'>
                <div className="bg-white dark:bg-gray-900 h-full w-full rounded-full flex items-center justify-center">
                  <User className='text-blue-600 dark:text-blue-400 h-4 w-4 sm:h-5 sm:w-5' />
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32">
                  {userDisplayName}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs px-1.5 py-0", roleBadge.className)}
                >
                  {roleBadge.label}
                </Badge>
              </div>
              <ChevronDown className='h-4 w-4 text-gray-500 dark:text-gray-400 hidden sm:block' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            {/* User Info */}
            <DropdownMenuLabel className="font-normal px-2 py-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", roleBadge.className)}
                  >
                    {roleBadge.label}
                  </Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground truncate">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Role-specific menu items */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/account" className="flex items-center py-2 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center py-2 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Admin/Super Admin specific items */}
              {(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/admin" className="flex items-center py-2 cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Super Admin specific items */}
              {userRole === UserRole.SUPER_ADMIN && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/system" className="flex items-center py-2 cursor-pointer text-red-600">
                    <Database className="mr-2 h-4 w-4" />
                    <span>System Management</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 py-2 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default RoleBasedHeader;