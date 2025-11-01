// components/CollaboratorAvatars/CollaboratorAvatars.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { User } from '../types'; // Fixed import path
import { Socket } from 'socket.io-client'; // Added missing import

interface CollaboratorAvatarsProps {
    connectedUsers: User[];
    currentUserId: string;
    socketRef: React.RefObject<Socket | null>; // Fixed type
    documentId: string;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
    connectedUsers,
    currentUserId,
    socketRef,
    documentId
}) => {
    const handleInviteUser = (): void => {
        const email = prompt('Enter email to invite:');
        if (email && socketRef.current?.connected) {
            socketRef.current.emit('invite-user', {
                documentId,
                email,
                role: 'EDITOR', // Added missing role
                invitedBy: currentUserId
            });
        }
    };

    const getStatusColor = (status?: string): string => {
        switch (status) {
            case 'active':
                return 'bg-gradient-to-br from-blue-400 to-purple-500';
            case 'viewing':
                return 'bg-gradient-to-br from-gray-400 to-gray-500';
            case 'typing':
                return 'bg-gradient-to-br from-green-400 to-emerald-500 ring-2 ring-green-300 animate-pulse';
            case 'idle':
                return 'bg-gradient-to-br from-yellow-400 to-orange-500';
            case 'away':
                return 'bg-gradient-to-br from-gray-300 to-gray-400';
            default:
                return 'bg-gradient-to-br from-blue-400 to-purple-500';
        }
    };

    const getStatusIndicator = (status?: string): React.ReactNode => {
        if (status === 'typing') {
            return (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            );
        }
        return null;
    };

    const generateAvatar = (name: string): string => {
        return name.charAt(0).toUpperCase();
    };

    const getDisplayUsers = (): User[] => {
        return connectedUsers.slice(0, 5); // Removed demo users fallback
    };

    const getOverflowCount = (): number => {
        return Math.max(0, connectedUsers.length - 5); // Use real connectedUsers
    };

    return (
        <div className="flex items-center space-x-1">
            {getDisplayUsers().map((user, index) => (
                <div
                    key={user.id || index}
                    className="relative"
                >
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm transition-all duration-200 cursor-pointer hover:scale-110 ${getStatusColor(user.status)}`}
                        title={`${user.name} - ${user.status || 'active'}${user.status === 'typing' ? ' (typing...)' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${user.name} is ${user.status || 'active'}${user.status === 'typing' ? ' and typing' : ''}`}
                    >
                        {user.avatar || generateAvatar(user.name)}
                    </div>
                    {getStatusIndicator(user.status)}
                </div>
            ))}

            {getOverflowCount() > 0 && (
                <div
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium cursor-pointer hover:bg-gray-300 transition-colors duration-200"
                    title={`${getOverflowCount()} more collaborators`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${getOverflowCount()} more collaborators`}
                >
                    +{getOverflowCount()}
                </div>
            )}

            <button
                onClick={handleInviteUser}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                title="Invite collaborator"
                aria-label="Invite new collaborator"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};