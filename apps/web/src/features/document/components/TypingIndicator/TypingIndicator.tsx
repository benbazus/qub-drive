import React from 'react';
import { User } from '../types';

interface TypingIndicatorProps {
    connectedUsers: User[];
    currentUserId: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    connectedUsers,
    currentUserId
}) => {
    const typingUsers = connectedUsers.filter(user => 
        user.status === 'typing' && user.id !== currentUserId
    );

    if (typingUsers.length === 0) {
        return null;
    }

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].name} is typing...`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
        } else {
            return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    return (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 z-50">
            <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                    {getTypingText()}
                </span>
            </div>
        </div>
    );
};