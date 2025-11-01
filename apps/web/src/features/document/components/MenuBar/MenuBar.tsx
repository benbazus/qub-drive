// components/MenuBar/MenuBar.tsx
import React, { useState } from 'react';
import { ChevronDown, Share2, Users, MessageSquare, History, Download, Save } from 'lucide-react';

interface MenuBarProps {
    showFormatMenu: boolean;
    setShowFormatMenu: (show: boolean) => void;
    onShareDocument?: () => void;
    onShowCollaborators?: () => void;
    onToggleComments?: () => void;
    onShowHistory?: () => void;
    onSaveDocument?: () => void;
    onExportDocument?: () => void;
    isConnected?: boolean;
    connectedUsers?: number;
}

interface MenuItem {
    label: string;
    onClick?: () => void;
    hasDropdown?: boolean;
    submenu?: SubmenuItem[];
}

interface SubmenuItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    shortcut?: string;
    disabled?: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
    showFormatMenu,
    setShowFormatMenu,
    onShareDocument,
    onShowCollaborators,
    onToggleComments,
    onShowHistory,
    onSaveDocument,
    onExportDocument,
    isConnected = false,
    connectedUsers = 0
}) => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const toggleFormatMenu = (): void => {
        setShowFormatMenu(!showFormatMenu);
    };

    const handleMenuClick = (action: string): void => {
        setActiveDropdown(activeDropdown === action ? null : action);
    };

    const fileSubmenu: SubmenuItem[] = [
        {
            label: 'Save',
            onClick: () => onSaveDocument?.(),
            icon: <Save size={16} />,
            shortcut: 'Ctrl+S'
        },
        {
            label: 'Export as PDF',
            onClick: () => onExportDocument?.(),
            icon: <Download size={16} />
        },
        {
            label: 'Document History',
            onClick: () => onShowHistory?.(),
            icon: <History size={16} />
        }
    ];

    const collaborationSubmenu: SubmenuItem[] = [
        {
            label: 'Share Document',
            onClick: () => onShareDocument?.(),
            icon: <Share2 size={16} />,
            shortcut: 'Ctrl+Shift+S'
        },
        {
            label: `Show Collaborators (${connectedUsers})`,
            onClick: () => onShowCollaborators?.(),
            icon: <Users size={16} />,
            disabled: !isConnected
        },
        {
            label: 'Toggle Comments',
            onClick: () => onToggleComments?.(),
            icon: <MessageSquare size={16} />,
            shortcut: 'Ctrl+Alt+M'
        }
    ];

    const menuItems: MenuItem[] = [
        { 
            label: 'File', 
            onClick: () => handleMenuClick('file'),
            hasDropdown: true,
            submenu: fileSubmenu
        },
        { label: 'Edit', onClick: () => handleMenuClick('edit') },
        { label: 'View', onClick: () => handleMenuClick('view') },
        { label: 'Insert', onClick: () => handleMenuClick('insert') },
        { label: 'Format', onClick: toggleFormatMenu, hasDropdown: true },
        { 
            label: 'Collaborate', 
            onClick: () => handleMenuClick('collaborate'),
            hasDropdown: true,
            submenu: collaborationSubmenu
        },
        { label: 'Tools', onClick: () => handleMenuClick('tools') },
        { label: 'Help', onClick: () => handleMenuClick('help') }
    ];

    const MenuButton: React.FC<{ item: MenuItem }> = ({ item }) => (
        <div className="relative">
            <button
                onClick={item.onClick}
                className={`text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 px-2 py-1 rounded ${
                    activeDropdown === item.label.toLowerCase() ? 'bg-gray-100' : ''
                }`}
                aria-label={`${item.label} menu`}
                aria-expanded={item.label === 'Format' ? showFormatMenu : activeDropdown === item.label.toLowerCase()}
                aria-haspopup={item.hasDropdown ? 'true' : undefined}
            >
                <span>{item.label}</span>
                {item.hasDropdown && (
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                            (item.label === 'Format' && showFormatMenu) || activeDropdown === item.label.toLowerCase() ? 'rotate-180' : ''
                        }`}
                    />
                )}
            </button>
            
            {/* Dropdown menu */}
            {item.submenu && activeDropdown === item.label.toLowerCase() && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                        {item.submenu.map((subItem, subIndex) => (
                            <button
                                key={subIndex}
                                onClick={() => {
                                    if (!subItem.disabled) {
                                        subItem.onClick();
                                        setActiveDropdown(null);
                                    }
                                }}
                                disabled={subItem.disabled}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 ${
                                    subItem.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    {subItem.icon && (
                                        <span className={subItem.disabled ? 'text-gray-300' : 'text-gray-500'}>
                                            {subItem.icon}
                                        </span>
                                    )}
                                    <span>{subItem.label}</span>
                                </div>
                                {subItem.shortcut && (
                                    <span className="text-xs text-gray-400 font-mono">
                                        {subItem.shortcut}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && !(event.target as Element).closest('.relative')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-2">
            <div className="flex items-center justify-between">
                <nav
                    className="flex items-center space-x-6 text-sm"
                    role="menubar"
                    aria-label="Document menu"
                >
                    {menuItems.map((item, index) => (
                        <MenuButton key={index} item={item} />
                    ))}
                </nav>
                
                {/* Connection status indicator */}
                <div className="flex items-center space-x-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-500">
                        {isConnected ? `Connected (${connectedUsers} users)` : 'Disconnected'}
                    </span>
                </div>
            </div>
        </div>
    );
};