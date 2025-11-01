import React from 'react'
import { cn } from '@/lib/utils'
import { PathCrumb } from '@/types/file'
import { Menu, ChevronRight, Moon, Sun, Bell, User, Settings, UserCircle, LogOut, ChevronDown } from 'lucide-react'
import { Link, useRouter } from '@tanstack/react-router'
import { useAuthUser, useLogout } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DriveHeaderProps {
  currentView: 'home' | 'my-drives' | 'shared' | 'starred' | 'recent' | 'trash'
  currentPath: PathCrumb[]
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  navigateToBreadcrumb: (index: number) => void
}

const DriveHeader: React.FC<DriveHeaderProps> = ({
  currentView,
  currentPath,

  setSidebarOpen,
  navigateToBreadcrumb
}) => {
  const user = useAuthUser();
  const logout = useLogout();
  const router = useRouter();

  // Theme toggle
  const toggleTheme = () => document.documentElement.classList.toggle('dark');

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.navigate({ to: '/sign-in' });
  };

  // Get user display name
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <header className='bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-30 flex h-16 sm:h-20 w-full shrink-0 items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 shadow-sm'>
      <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
        <button
          onClick={() => setSidebarOpen(true)}
          className='lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition-colors flex-shrink-0'
        >
          <Menu className='h-5 w-5 sm:h-6 sm:w-6' />
          <span className='sr-only'>Open Sidebar</span>
        </button>

        {/* Breadcrumb - Responsive */}
        {(currentView === 'home' || currentView === 'my-drives') && (
          <nav className='hidden sm:flex items-center space-x-1 sm:space-x-2 text-sm min-w-0 flex-1'>
            {currentPath.map((crumb, index) => (
              <React.Fragment key={crumb.id ?? 'root'}>
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={cn(
                    'hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 truncate max-w-[120px] sm:max-w-none',
                    index === currentPath.length - 1 &&
                    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  )}
                  title={crumb.name}
                >
                  {crumb.name}
                </button>
                {index < currentPath.length - 1 && (
                  <ChevronRight className='text-gray-400 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0' />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Mobile breadcrumb - Show current folder only */}
        {(currentView === 'home' || currentView === 'my-drives') && (
          <div className='sm:hidden flex items-center min-w-0 flex-1'>
            <span className='text-sm font-medium text-gray-900 dark:text-white truncate'>
              {currentPath[currentPath.length - 1]?.name}
            </span>
          </div>
        )}
      </div>

      {/* Header Actions - Responsive */}
      <div className='flex items-center space-x-1 sm:space-x-3 flex-shrink-0'>
        <button
          onClick={toggleTheme}
          className='hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 sm:p-2.5 transition-all duration-200 hover:scale-105 relative'
        >
          <Sun className='h-4 w-4 sm:h-5 sm:w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute h-4 w-4 sm:h-5 sm:w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </button>
        
        {/* Hide notifications on mobile to save space */}
        <button className='hidden sm:block hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2.5 transition-all duration-200 hover:scale-105 relative'>
          <Bell className='text-gray-600 dark:text-gray-400 h-5 w-5' />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        </button>
        
        {/* User Dropdown Menu - Responsive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-1.5 sm:p-2 transition-all duration-200 hover:scale-105'>
              <div className='bg-gradient-to-r from-blue-500 to-purple-600 h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0.5 shadow-lg'>
                <div className="bg-white dark:bg-gray-900 h-full w-full rounded-full flex items-center justify-center">
                  <User className='text-blue-600 dark:text-blue-400 h-4 w-4 sm:h-5 sm:w-5' />
                </div>
              </div>
              <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hidden sm:block' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            {/* User Info Section */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Navigation Menu Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings/account" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default DriveHeader