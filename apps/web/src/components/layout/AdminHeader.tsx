import React, { useState } from 'react';
import { Menu, User, Settings, UserCircle, LogOut, ChevronDown, Upload } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BuilkTransfer from '@/features/BuilkTransfer';
//import BuilkTransfer from '@/components/BuilkTransfer';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: () => void;
  hamburgerRef?: React.RefObject<HTMLButtonElement>;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ setSidebarOpen, hamburgerRef }) => {
  const user = useAuthUser();
  const logout = useLogout();
  const router = useRouter();
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    logout();
    router.navigate({ to: '/sign-in' });
  };

  const onBulkTransferOpen = async () => {

    router.navigate({ to: '/dashboard/BuilkTransfer' });
  };

  // Get user display name
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const userEmail = user?.email;



  return (
    <>
      <header className='bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-30 flex h-16 sm:h-20 w-full shrink-0 items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 shadow-sm'>
        <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
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
            <span className='sr-only'>Open Sidebar</span>
          </button>

          {/* <button
            onClick={() => setIsBulkTransferOpen(true)}
            className='flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base shadow-md hover:shadow-lg flex-shrink-0'
          >
            <Upload className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='hidden xs:inline'>Bulk Upload</span>
            <span className='xs:hidden'>Upload</span>
          </button> */}

          <button onClick={onBulkTransferOpen}
            className='flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base shadow-md hover:shadow-lg flex-shrink-0'
          >
            <Upload className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='hidden xs:inline'>Bulk Upload</span>
            <span className='xs:hidden'>Bulk Transfer</span>
          </button>

        </div>

        {/* Header Actions - Responsive */}
        <div className='flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0'>

          {/* Notifications - Hidden on very small screens */}

          {/* <button className='md:flex hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-xl p-2 sm:p-2.5 transition-all duration-200 hover:scale-105 relative items-center justify-center hidden'>
            <Bell className='text-gray-600 dark:text-gray-400 h-5 w-5 hidden' />
            <span className="absolute top-1 right-1 h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className='sr-only'>Notifications</span>
          </button> */}

          {/* User Dropdown Menu - Fully Responsive */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-xl p-1.5 sm:p-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'>
                <div className='bg-gradient-to-r from-blue-500 to-purple-600 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full p-0.5 shadow-md sm:shadow-lg'>
                  <div className="bg-white dark:bg-gray-900 h-full w-full rounded-full flex items-center justify-center">
                    <User className='text-blue-600 dark:text-blue-400 h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5' />
                  </div>
                </div>
                <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hidden sm:block' />
                <span className='sr-only'>User menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 sm:w-64" align="end" forceMount>
              {/* User Info Section - Responsive */}
              <DropdownMenuLabel className="font-normal px-2 py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm sm:text-base font-medium leading-none truncate">{userDisplayName}</p>
                  <p className="text-xs sm:text-sm leading-none text-muted-foreground truncate">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Navigation Menu Items - Touch-friendly for mobile */}
              <DropdownMenuGroup className='hidden'>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center py-2 sm:py-1.5 cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center py-2 sm:py-1.5 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings/account" className="flex items-center py-2 sm:py-1.5 cursor-pointer">
                    <User className="mr-2 h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Account</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              {/* Logout - Touch-friendly */}
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 py-2 sm:py-1.5 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Bulk Transfer Modal */}
      <Dialog open={isBulkTransferOpen} onOpenChange={setIsBulkTransferOpen}>
        <DialogContent className='max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-0'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Bulk Transfer</DialogTitle>
            <DialogDescription>Upload and transfer multiple files at once</DialogDescription>
          </DialogHeader>
          <div className='w-full'>
            <BuilkTransfer />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { AdminHeader };