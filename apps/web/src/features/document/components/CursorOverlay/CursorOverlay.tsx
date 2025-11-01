import React from 'react';
import { User } from '../types';

interface CursorData {
    userId: string;
    userName: string;
    position: {
        x: number;
        y: number;
        line: number;
        char: number;
    };
    selection?: {
        start: number;
        end: number;
        text: string;
    };
    timestamp: number;
}

interface CursorOverlayProps {
    currentUserId: string;
    connectedUsers: User[];
    cursors: Map<string, CursorData>;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({

    connectedUsers,
    cursors
}) => {

    const getUserColor = (userId: string): string => {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    const getUserName = (userId: string): string => {
        const user = connectedUsers.find(u => u.id === userId);
        return user?.name || 'Unknown User';
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from(cursors.entries()).map(([userId, cursor]) => (
                <div
                    key={userId}
                    className="absolute transition-all duration-200 ease-out"
                    style={{
                        left: `${cursor.position.x}px`,
                        top: `${cursor.position.y}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    {/* Cursor Line */}
                    <div
                        className="w-0.5 h-5 animate-pulse"
                        style={{ backgroundColor: getUserColor(userId) }}
                    />

                    {/* User Name Label */}
                    <div
                        className="absolute -top-8 -left-1 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg z-20"
                        style={{ backgroundColor: getUserColor(userId) }}
                    >
                        {getUserName(userId)}
                        <div
                            className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent"
                            style={{ borderTopColor: getUserColor(userId) }}
                        />
                    </div>

                    {/* Selection Highlight (if text is selected) */}
                    {cursor.selection && cursor.selection.text && (
                        <div
                            className="absolute opacity-20 rounded"
                            style={{
                                backgroundColor: getUserColor(userId),
                                left: '0px',
                                top: '0px',
                                width: `${cursor.selection.text.length * 8}px`, // Approximate width
                                height: '20px'
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};