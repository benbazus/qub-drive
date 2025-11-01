import React from 'react'
import { cn } from '@/lib/utils'
import {
  Home, FolderOpen, Share, Star, Clock, Trash,
  ChevronLeft, ChevronRight, Settings
} from 'lucide-react'
import { PathCrumb } from '@/types/file'

interface SidebarProps {
  currentView: 'home' | 'my-drives' | 'shared' | 'starred' | 'recent' | 'trash' | 'settings'
  setCurrentView: (view: 'home' | 'my-drives' | 'shared' | 'starred' | 'recent' | 'trash' | 'settings') => void
  setCurrentPath: React.Dispatch<React.SetStateAction<PathCrumb[]>>
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  setCurrentPath,
  isCollapsed,
  onToggleCollapse
}) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my-drives', label: 'My Files', icon: FolderOpen },
    { id: 'shared', label: 'Shared', icon: Share },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'trash', label: 'Trash', icon: Trash },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] as const

  const handleViewChange = (view: typeof currentView) => {
    setCurrentView(view)
    // Reset path when changing views
    setCurrentPath([{ id: null, name: 'My Drives' }])
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar Header */}
      <div className="flex h-20 items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Qub Drive
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:scale-[1.02]',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isCollapsed && 'mx-auto')} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4">
        <button
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:scale-[1.02] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Settings className={cn('h-5 w-5 shrink-0', isCollapsed && 'mx-auto')} />
          {!isCollapsed && (
            <span className="font-medium">Settings</span>
          )}
        </button>
      </div>
    </div>
  )
}

export default Sidebar