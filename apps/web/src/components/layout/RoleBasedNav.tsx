import { Shield, Users, Activity, BarChart3, FileText, Settings, HardDrive } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'guest';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  roles: UserRole[];
  description?: string;
}

interface RoleBasedNavProps {
  userRole: UserRole;
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

// Define navigation items with role-based access
const roleBasedNavItems: NavItem[] = [
  // Super Admin Routes
  {
    icon: Shield,
    label: 'Super Admin',
    href: '/dashboard/super-admin',
    roles: ['super_admin'],
    description: 'System overview and management',
  },
  {
    icon: Users,
    label: 'User Management',
    href: '/dashboard/super-admin/users',
    roles: ['super_admin'],
    description: 'Manage users and permissions',
  },

  // Admin Routes
  {
    icon: BarChart3,
    label: 'Admin Dashboard',
    href: '/dashboard/admin',
    roles: ['admin', 'super_admin'],
    description: 'Content and user overview',
  },

  // Manager Routes
  {
    icon: Activity,
    label: 'Manager Dashboard',
    href: '/dashboard/manager',
    roles: ['manager', 'admin', 'super_admin'],
    description: 'Team oversight and reports',
  },

  // User Routes (All roles)
  {
    icon: HardDrive,
    label: 'My Dashboard',
    href: '/dashboard/user-overview',
    roles: ['user', 'manager', 'admin', 'super_admin'],
    description: 'Personal files and activity',
  },

  // Settings (All roles)
  {
    icon: Settings,
    label: 'Settings',
    href: '/dashboard/settings',
    roles: ['user', 'manager', 'admin', 'super_admin'],
    description: 'Account and preferences',
  },
];

export function RoleBasedNav({ userRole, isCollapsed = false, onItemClick }: RoleBasedNavProps) {
  const location = useLocation();

  // Filter navigation items based on user role
  const visibleNavItems = roleBasedNavItems.filter(item =>
    item.roles.includes(userRole)
  );

  if (visibleNavItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboards
          </h2>
        </div>
      )}

      <nav className="space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              {!isCollapsed && (
                <>
                  <div className="flex-1 truncate">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Helper function to check if user has permission for a route
export function hasPermissionForRoute(userRole: UserRole, routePath: string): boolean {
  const matchingItem = roleBasedNavItems.find(item =>
    routePath === item.href || routePath.startsWith(item.href + '/')
  );

  if (!matchingItem) {
    return true; // Allow access to routes not in the role-based nav
  }

  return matchingItem.roles.includes(userRole);
}

// Get role hierarchy level (higher number = more privileges)
export function getRoleLevel(role: UserRole): number {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    manager: 2,
    admin: 3,
    super_admin: 4,
  };

  return roleHierarchy[role] || 0;
}

// Check if user has at least a certain role level
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
}
