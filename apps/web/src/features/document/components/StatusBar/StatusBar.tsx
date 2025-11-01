// components/StatusBar/StatusBar.tsx
import React from 'react';
import { Eye } from 'lucide-react';

interface StatusBarProps {
    lastSaveTime: Date | null;
    isConnected: boolean;
    documentContent: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    lastSaveTime,
    isConnected,
    documentContent
}) => {
    const getLastSaveText = (): string => {
        if (lastSaveTime) {
            return `Last saved: ${lastSaveTime.toLocaleTimeString()}`;
        }
        return 'Last edit was seconds ago';
    };

    const getSyncStatusText = (): string => {
        return isConnected
            ? 'Real-time sync enabled'
            : 'Offline mode (changes saved locally)';
    };

    const getWordCount = (): number => {
        if (!documentContent) return 0;

        // Remove HTML tags and count words
        const textContent = documentContent.replace(/<[^>]*>/g, '');
        const words = textContent.split(' ').filter(word => word.length > 0);
        return words.length;
    };

    const getConnectionStatusColor = (): string => {
        return isConnected ? 'bg-green-500' : 'bg-red-500';
    };

    return (
        <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
                <span>{getLastSaveText()}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${getConnectionStatusColor()}`} />
                    <span>{getSyncStatusText()}</span>
                </span>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    className="hover:text-gray-700 transition-colors duration-200 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 px-2 py-1 rounded"
                    aria-label="Switch to viewing mode"
                >
                    <Eye size={16} />
                    <span>Viewing</span>
                </button>
                <span aria-label={`Document contains ${getWordCount()} words`}>
                    Words: {getWordCount()}
                </span>
            </div>
        </div>
    );
};