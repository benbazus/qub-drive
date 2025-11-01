// components/Header/Header.tsx
import React from 'react';
import { FileText, Star, Folder, Wifi, WifiOff, Share2, User } from 'lucide-react';
import { CollaboratorAvatars } from '../CollaboratorAvatars/CollaboratorAvatars';
import { User as UserType, ConnectionStatus } from '../types'; // Fixed import path
import { Socket } from 'socket.io-client';

interface HeaderProps {
    documentTitle: string;
    setDocumentTitle: (title: string) => void;
    isStarred: boolean;
    setIsStarred: (starred: boolean) => void;
    connectionStatus: ConnectionStatus;
    connectedUsers: UserType[];
    isConnected: boolean;
    disconnectSocket: () => void;
    initializeSocket: () => void;
    showShareDialog: boolean;
    setShowShareDialog: (show: boolean) => void;
    currentUserId: string;
    socketRef: React.RefObject<Socket | null>;
    documentId: string;
}

export const Header: React.FC<HeaderProps> = ({
    documentTitle,
    setDocumentTitle,
    isStarred,
    setIsStarred,
    connectionStatus,
    connectedUsers,
    isConnected,
    disconnectSocket,
    initializeSocket,
    setShowShareDialog,
    currentUserId,
    socketRef,
    documentId
}) => {
    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDocumentTitle(event.target.value);
    };

    const toggleStar = () => {
        setIsStarred(!isStarred);
    };

    const toggleConnection = () => {
        if (isConnected) {
            disconnectSocket();
        } else {
            initializeSocket();
        }
    };

    const openShareDialog = () => {
        setShowShareDialog(true);
    };

    const getConnectionStatusText = (): string => {
        switch (connectionStatus) {
            case 'connected':
                return `${connectedUsers.length + 1} online`;
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
            default:
                return 'Offline';
        }
    };

    const getConnectionStatusColor = (): string => {
        switch (connectionStatus) {
            case 'connected':
                return 'bg-green-500';
            case 'connecting':
                return 'bg-yellow-500 animate-pulse';
            case 'disconnected':
            default:
                return 'bg-red-500';
        }
    };

    return (
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <FileText className="text-blue-600" size={24} />
                        <span className="font-semibold text-gray-800 hidden sm:block">Docs</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            value={documentTitle}
                            onChange={handleTitleChange}
                            className="text-lg font-medium text-gray-800 bg-transparent border-none outline-none hover:bg-gray-100 px-2 py-1 rounded-md transition-colors duration-200 min-w-0 max-w-xs"
                            placeholder="Untitled Document"
                            type="text"
                        />
                        <button
                            onClick={toggleStar}
                            className={`p-1 rounded-md transition-colors duration-200 ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                                }`}
                            aria-label={isStarred ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Star size={20} fill={isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            aria-label="Move to folder"
                        >
                            <Folder size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${getConnectionStatusColor()}`} />
                        <span className="text-sm text-gray-600">
                            {getConnectionStatusText()}
                        </span>
                    </div>

                    <button
                        onClick={toggleConnection}
                        className={`p-2 rounded-md transition-colors duration-200 ${isConnected ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                        title={isConnected ? 'Disconnect' : 'Connect to collaboration server'}
                        aria-label={isConnected ? 'Disconnect from server' : 'Connect to server'}
                    >
                        {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
                    </button>

                    <CollaboratorAvatars
                        connectedUsers={connectedUsers}
                        currentUserId={currentUserId}
                        socketRef={socketRef}
                        documentId={documentId}
                    />

                    <button
                        onClick={openShareDialog}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        aria-label="Share document"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>

                    <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label="User menu"
                    >
                        <User size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};