
// Hook for managing comments - hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import { Comment } from '../components/types';
import { Socket } from 'socket.io-client';

interface UseCommentsProps {
    documentId: string;
    socket: Socket | null;
    currentUserId: string;
}

export const useComments = ({ documentId, socket }: UseCommentsProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState<boolean>(false);

    // Socket event handlers
    useEffect(() => {
        if (socket) {
            const handleCommentAdded = (comment: Comment) => {
                setComments(prev => [...prev, comment]);
            };

            const handleCommentReplied = (reply: Comment) => {
                setComments(prev => [...prev, reply]);
            };

            const handleCommentResolved = (data: { commentId: string }) => {
                setComments(prev =>
                    prev.map(comment =>
                        comment.id === data.commentId
                            ? { ...comment, isResolved: true }
                            : comment
                    )
                );
            };

            const handleCommentDeleted = (data: { commentId: string }) => {
                setComments(prev =>
                    prev.filter(comment =>
                        comment.id !== data.commentId && comment.parentId !== data.commentId
                    )
                );
            };

            const handleCommentsLoaded = (loadedComments: Comment[]) => {
                setComments(loadedComments);
            };

            socket.on('comment-added', handleCommentAdded);
            socket.on('comment-replied', handleCommentReplied);
            socket.on('comment-resolved', handleCommentResolved);
            socket.on('comment-deleted', handleCommentDeleted);
            socket.on('comments-loaded', handleCommentsLoaded);

            // Load existing comments when socket connects
            if (socket.connected) {
                socket.emit('load-comments', { documentId });
            }

            return () => {
                socket.off('comment-added', handleCommentAdded);
                socket.off('comment-replied', handleCommentReplied);
                socket.off('comment-resolved', handleCommentResolved);
                socket.off('comment-deleted', handleCommentDeleted);
                socket.off('comments-loaded', handleCommentsLoaded);
            };
        }
    }, [socket, documentId]);

    const toggleComments = useCallback(() => {
        setShowComments(prev => !prev);
    }, []);

    return {
        comments,
        showComments,
        setShowComments,
        toggleComments
    };
};
