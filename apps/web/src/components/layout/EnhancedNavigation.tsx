import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getMenuSectionsForRole, getIconComponent } from '@/config/menuConfig';
import { UserRole, MenuSection } from '@packages/shared-types';

interface EnhancedNavigationProps {
  userRole: UserRole;
  isCollapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

interface NavigationSectionProps {
  section: MenuSection;
  isCollapsed: boolean;
  onItemClick?: () => void;
  currentPath: string;
}

const NavigationSection: React.FC<NavigationSectionProps> = ({
  section,
  isCollapsed,
  onItemClick,
  currentPath
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const _hasActiveItem = section.items.some((item: any) => 
    currentPath === item.href || currentPath.startsWith(item.href + '/')
  );

  if (section.items.length === 0) return null;

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            <span>{section.title}</span>
            <ChevronDown className={cn(
              "h-3 w-3 transition-transform duration-200",
              !isOpen && "-rotate-90"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {section.items.map((item: any) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              const IconComponent = getIconComponent(item.icon);

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent group',
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={item.description}
                >
                  <IconComponent className={cn(
                    'h-4 w-4 flex-shrink-0 transition-colors',
                    isActive && 'text-primary'
                  )} />
                  <div className="flex-1 truncate">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate group-hover:text-muted-foreground/80">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge variant="default" className="ml-auto text-xs bg-green-500 hover:bg-green-600">
                      New
                    </Badge>
                  )}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Collapsed view - show icons only */}
      {isCollapsed && (
        <div className="space-y-1">
          {section.items.map((item: any) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            const IconComponent = getIconComponent(item.icon);

            return (
              <div key={item.id} className="relative group">
                <Link
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-all hover:bg-accent',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <IconComponent className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive && 'text-primary'
                  )} />
                </Link>

                {/* Tooltip for collapsed items */}
                <div className={cn(
                  "absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border shadow-md",
                  "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                  "top-1/2 -translate-y-1/2"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isNew && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        New
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div>
                  )}
                  {/* Tooltip arrow */}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover rotate-45 border-l border-b"></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  userRole,
  isCollapsed = false,
  onItemClick,
  className
}) => {
  const location = useLocation();
  const menuSections = getMenuSectionsForRole(userRole);

  if (menuSections.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p className="text-sm">No menu items available for your role.</p>
      </div>
    );
  }

  return (
    <nav className={cn("space-y-6", className)}>
      {menuSections.map((section) => (
        <NavigationSection
          key={section.id}
          section={section}
          isCollapsed={isCollapsed}
          onItemClick={onItemClick}
          currentPath={location.pathname}
        />
      ))}
    </nav>
  );
};

// Role-specific navigation shortcuts
export const UserNavigation: React.FC<Omit<EnhancedNavigationProps, 'userRole'>> = (props) => (
  <EnhancedNavigation {...props} userRole={UserRole.USER} />
);

export const AdminNavigation: React.FC<Omit<EnhancedNavigationProps, 'userRole'>> = (props) => (
  <EnhancedNavigation {...props} userRole={UserRole.ADMIN} />
);

export const SuperAdminNavigation: React.FC<Omit<EnhancedNavigationProps, 'userRole'>> = (props) => (
  <EnhancedNavigation {...props} userRole={UserRole.SUPER_ADMIN} />
);

export default EnhancedNavigation;