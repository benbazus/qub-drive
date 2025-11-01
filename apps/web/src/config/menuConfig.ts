import { 
  Shield, 
  Users, 
  Activity, 
  BarChart3, 
  FileText, 
  Settings, 
  HardDrive,
  Star,
  Clock,
  Trash2,
  Share2,
  Lock,
  Database,
  Globe,
  Zap,
  AlertTriangle,
  UserCheck,
  FileSearch,
  TrendingUp,
  Server,
  Key,
  Archive,
  Bell,
  Palette,
  Download,
  Upload,
  FolderOpen,
  PieChart,
  LineChart,
  UserPlus,
  ShieldCheck,
  Eye,
  History,
  Workflow,
  Cloud,
  CreditCard,
  Mail,
  Smartphone,
  Monitor,
  Layers,
  GitBranch,
  Package
} from 'lucide-react';
import { MenuItem, MenuSection, MenuCategory, UserRole } from '@packages/shared-types';

// Define comprehensive menu items for all user roles
export const menuItems: MenuItem[] = [
  // DASHBOARD ITEMS
  {
    id: 'dashboard-overview',
    label: 'Dashboard',
    icon: 'Monitor',
    href: '/dashboard',
    description: 'Main dashboard overview',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.DASHBOARD
  },
  {
    id: 'user-dashboard',
    label: 'My Dashboard',
    icon: 'HardDrive',
    href: '/dashboard/user-overview',
    description: 'Personal files and activity',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.DASHBOARD
  },
  {
    id: 'manager-dashboard',
    label: 'Manager Dashboard',
    icon: 'Activity',
    href: '/dashboard/manager',
    description: 'Team oversight and reports',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.DASHBOARD
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    icon: 'BarChart3',
    href: '/dashboard/admin',
    description: 'Content and user overview',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.DASHBOARD
  },
  {
    id: 'super-admin-dashboard',
    label: 'Super Admin',
    icon: 'Shield',
    href: '/dashboard/super-admin',
    description: 'System overview and management',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.DASHBOARD
  },

  // FILE MANAGEMENT
  {
    id: 'my-files',
    label: 'My Files',
    icon: 'HardDrive',
    href: '/dashboard/drive/my-drive',
    description: 'Your personal files and folders',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },
  {
    id: 'shared-files',
    label: 'Shared with Me',
    icon: 'Users',
    href: '/dashboard/drive/shared-with-me',
    description: 'Files shared by others',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },
  {
    id: 'starred-files',
    label: 'Starred',
    icon: 'Star',
    href: '/dashboard/drive/starred',
    description: 'Your starred files',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },
  {
    id: 'recent-files',
    label: 'Recent',
    icon: 'Clock',
    href: '/dashboard/drive/recent',
    description: 'Recently accessed files',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },
  {
    id: 'trash',
    label: 'Trash',
    icon: 'Trash2',
    href: '/dashboard/drive/trash',
    description: 'Deleted files',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },
  {
    id: 'file-search',
    label: 'Advanced Search',
    icon: 'FileSearch',
    href: '/dashboard/files/search',
    description: 'Search across all files',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.FILES
  },

  // COLLABORATION
  {
    id: 'shared-links',
    label: 'Shared Links',
    icon: 'Share2',
    href: '/dashboard/sharing/links',
    description: 'Manage shared links',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.COLLABORATION
  },
  {
    id: 'team-folders',
    label: 'Team Folders',
    icon: 'FolderOpen',
    href: '/dashboard/collaboration/team-folders',
    description: 'Collaborative team spaces',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.COLLABORATION
  },
  {
    id: 'active-sessions',
    label: 'Active Sessions',
    icon: 'Activity',
    href: '/dashboard/collaboration/sessions',
    description: 'Live collaboration sessions',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.COLLABORATION
  },

  // USER MANAGEMENT (Admin+)
  {
    id: 'user-management',
    label: 'User Management',
    icon: 'Users',
    href: '/dashboard/admin/users',
    description: 'Manage users and permissions',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.ADMINISTRATION
  },
  {
    id: 'role-management',
    label: 'Roles & Permissions',
    icon: 'UserCheck',
    href: '/dashboard/admin/roles',
    description: 'Configure user roles',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.ADMINISTRATION
  },
  {
    id: 'group-management',
    label: 'Groups',
    icon: 'UserPlus',
    href: '/dashboard/admin/groups',
    description: 'Manage user groups',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.ADMINISTRATION
  },

  // ANALYTICS & REPORTING
  {
    id: 'analytics-overview',
    label: 'Analytics',
    icon: 'TrendingUp',
    href: '/dashboard/analytics',
    description: 'Usage analytics and insights',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.ANALYTICS
  },
  {
    id: 'storage-analytics',
    label: 'Storage Reports',
    icon: 'PieChart',
    href: '/dashboard/analytics/storage',
    description: 'Storage usage reports',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.ANALYTICS
  },
  {
    id: 'user-activity',
    label: 'User Activity',
    icon: 'LineChart',
    href: '/dashboard/analytics/activity',
    description: 'User activity reports',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.ANALYTICS
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: 'History',
    href: '/dashboard/security/audit-logs',
    description: 'System audit trail',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SECURITY
  },

  // SYSTEM MANAGEMENT (Super Admin)
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: 'Server',
    href: '/dashboard/system/settings',
    description: 'Core system configuration',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SYSTEM
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'Workflow',
    href: '/dashboard/system/integrations',
    description: 'Third-party integrations',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SYSTEM
  },
  {
    id: 'backup-management',
    label: 'Backups',
    icon: 'Archive',
    href: '/dashboard/system/backups',
    description: 'Backup management',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SYSTEM
  },
  {
    id: 'security-settings',
    label: 'Security',
    icon: 'ShieldCheck',
    href: '/dashboard/system/security',
    description: 'Security configuration',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SECURITY
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: 'Key',
    href: '/dashboard/system/api-keys',
    description: 'API key management',
    roles: [UserRole.SUPER_ADMIN],
    category: MenuCategory.SECURITY
  },

  // SETTINGS (All Users)
  {
    id: 'account-settings',
    label: 'Account Settings',
    icon: 'Settings',
    href: '/dashboard/settings/account',
    description: 'Personal account settings',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.SETTINGS
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: 'Palette',
    href: '/dashboard/settings/preferences',
    description: 'UI and notification preferences',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.SETTINGS
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    href: '/dashboard/settings/notifications',
    description: 'Notification settings',
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.SETTINGS
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'CreditCard',
    href: '/dashboard/settings/billing',
    description: 'Subscription and billing',
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: MenuCategory.SETTINGS
  }
];

// Define menu sections with proper organization
export const menuSections: MenuSection[] = [
  {
    id: 'dashboards',
    title: 'Dashboards',
    category: MenuCategory.DASHBOARD,
    items: menuItems.filter(item => item.category === MenuCategory.DASHBOARD),
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 1
  },
  {
    id: 'files',
    title: 'Files & Storage',
    category: MenuCategory.FILES,
    items: menuItems.filter(item => item.category === MenuCategory.FILES),
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 2
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    category: MenuCategory.COLLABORATION,
    items: menuItems.filter(item => item.category === MenuCategory.COLLABORATION),
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 3
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    category: MenuCategory.ANALYTICS,
    items: menuItems.filter(item => item.category === MenuCategory.ANALYTICS),
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 4
  },
  {
    id: 'administration',
    title: 'Administration',
    category: MenuCategory.ADMINISTRATION,
    items: menuItems.filter(item => item.category === MenuCategory.ADMINISTRATION),
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 5
  },
  {
    id: 'system',
    title: 'System Management',
    category: MenuCategory.SYSTEM,
    items: menuItems.filter(item => item.category === MenuCategory.SYSTEM),
    roles: [UserRole.SUPER_ADMIN],
    order: 6
  },
  {
    id: 'security',
    title: 'Security',
    category: MenuCategory.SECURITY,
    items: menuItems.filter(item => item.category === MenuCategory.SECURITY),
    roles: [UserRole.SUPER_ADMIN],
    order: 7
  },
  {
    id: 'settings',
    title: 'Settings',
    category: MenuCategory.SETTINGS,
    items: menuItems.filter(item => item.category === MenuCategory.SETTINGS),
    roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    order: 8
  }
];

// Icon mapping for dynamic icon rendering
export const iconMap = {
  Monitor,
  HardDrive,
  Activity,
  BarChart3,
  Shield,
  Users,
  Star,
  Clock,
  Trash2,
  Share2,
  FolderOpen,
  FileSearch,
  UserCheck,
  UserPlus,
  TrendingUp,
  PieChart,
  LineChart,
  History,
  Server,
  Workflow,
  Archive,
  ShieldCheck,
  Key,
  Settings,
  Palette,
  Bell,
  CreditCard,
  FileText,
  Lock,
  Database,
  Globe,
  Zap,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  Layers,
  GitBranch,
  Package,
  Cloud,
  Mail,
  Smartphone
};

// Helper functions
export function getMenuItemsForRole(userRole: UserRole): MenuItem[] {
  return menuItems.filter(item => item.roles.includes(userRole));
}

export function getMenuSectionsForRole(userRole: UserRole): MenuSection[] {
  return menuSections
    .filter(section => section.roles.includes(userRole))
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(userRole))
    }))
    .filter(section => section.items.length > 0)
    .sort((a, b) => a.order - b.order);
}

export function hasAccessToMenuItem(userRole: UserRole, menuItemId: string): boolean {
  const item = menuItems.find((item: any) => item.id === menuItemId);
  return item ? item.roles.includes(userRole) : false;
}

export function getIconComponent(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] || HardDrive;
}