/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  MessageCircle,
  Send,
  X,
  Check,
  MoreHorizontal,
  Reply,
} from "lucide-react";
import { User } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentEndpoint, Comment } from "@/api/endpoints/document.endpoint";

interface CommentsPanelProps {
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  documentId: string;
  currentUserId: string;
  currentUser: User;
}

const MAX_COMMENT_LENGTH = 1000;
const MAX_REPLY_LENGTH = 500;

const CommentAvatar: React.FC<{ avatar?: string; email: string }> = ({
  avatar,
  email,
}) => (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
    {avatar || email.substring(0, 2).toUpperCase()}
  </div>
);

const CommentHeader: React.FC<{
  comment: Comment;
  currentUserId: string;
  formatDate: (date: Date) => string;
  handleDeleteComment: (commentId: string) => void;
}> = ({ comment, currentUserId, formatDate, handleDeleteComment }) => (
  <div className="flex items-center justify-between mb-1">
    <div className="flex items-center space-x-2">
      <p className="text-sm font-semibold text-gray-900">
        {comment.user?.firstName || comment.author?.firstName}{" "}
        {comment.user?.lastName || comment.author?.lastName}
      </p>
      <span className="text-xs text-gray-400">•</span>
      <span className="text-xs text-gray-500">
        {formatDate(new Date(comment.createdAt))}
      </span>
    </div>
    {(comment.user?.id || comment.author?.id) === currentUserId && (
      <button
        onClick={() => handleDeleteComment(comment.id)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        title="Delete comment"
        aria-label="Delete comment"
      >
        <MoreHorizontal
          size={14}
          className="text-gray-400 hover:text-gray-600"
        />
      </button>
    )}
  </div>
);

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  showComments,
  setShowComments,
  documentId,
  currentUserId,
  currentUser,
}) => {
  const [newComment, setNewComment] = useState<string>("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Query for fetching comments
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", documentId],
    queryFn: () => DocumentEndpoint.getComments(documentId),
    enabled: !!documentId,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comments = commentsData?.comments || [];

  // Mutations
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; position?: any }) =>
      DocumentEndpoint.addComment(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setNewComment("");
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create comment");
    },
  });

  const replyCommentMutation = useMutation({
    mutationFn: (data: { commentId: string; content: string }) =>
      DocumentEndpoint.addCommentReply(data.commentId, {
        content: data.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setReplyContent("");
      setReplyTo(null);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to reply to comment");
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      DocumentEndpoint.toggleCommentResolution(commentId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to resolve comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      DocumentEndpoint.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to delete comment");
    },
  });

  // Destructure mutateAsync functions for stable references
  const { mutateAsync: createComment } = createCommentMutation;
  const { mutateAsync: replyToComment } = replyCommentMutation;
  const { mutateAsync: resolveComment } = resolveCommentMutation;
  const { mutateAsync: deleteComment } = deleteCommentMutation;

  useEffect(() => {
    if (showComments && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showComments]);

  useEffect(() => {
    if (replyTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyTo]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH) {
      setError(
        newComment.length > MAX_COMMENT_LENGTH
          ? "Comment is too long"
          : "Comment cannot be empty"
      );
      return;
    }

    setError(null);

    try {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || "";

      await createComment({
        content: newComment.trim(),
        position: selectedText
          ? {
              text: selectedText,
              start: selection?.anchorOffset || 0,
              end: selection?.focusOffset || 0,
            }
          : null,
      });

      if (commentInputRef.current) {
        commentInputRef.current.style.height = "auto";
      }
    } catch   {
      // Error is handled by the mutation's onError
    }
  }, [createComment, newComment]);

  const handleReply = useCallback(
    async (commentId: string) => {
      if (!replyContent.trim() || replyContent.length > MAX_REPLY_LENGTH) {
        setError(
          replyContent.length > MAX_REPLY_LENGTH
            ? "Reply is too long"
            : "Reply cannot be empty"
        );
        return;
      }

      setError(null);

      try {
        await replyToComment({
          commentId,
          content: replyContent.trim(),
        });
      } catch   {
        // Error is handled by the mutation's onError
      }
    },
    [replyContent, replyToComment]
  );

  const handleResolveComment = useCallback(
    async (commentId: string) => {
      setError(null);

      try {
        await resolveComment(commentId);
      } catch   {
        // Error is handled by the mutation's onError
      }
    },
    [resolveComment]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (window.confirm("Are you sure you want to delete this comment?")) {
        setError(null);

        try {
          await deleteComment(commentId);
        } catch   {
          // Error is handled by the mutation's onError
        }
      }
    },
    [deleteComment]
  );

  const handleKeyPress = useCallback(
    (
      e: React.KeyboardEvent,
      action: "comment" | "reply",
      commentId?: string
    ) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (action === "comment") {
          handleAddComment();
        } else if (action === "reply" && commentId) {
          handleReply(commentId);
        }
      }
    },
    [handleAddComment, handleReply]
  );

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // const getInitials = (email: string): string => {
  //     return email?.substring(0, 2).toUpperCase() || '??';
  // };

  const formatDate = useCallback((date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }
    return date.toLocaleDateString();
  }, []);

  const commentThreads = useMemo(() => comments || [], [comments]);
  const getReplies = useCallback(
    (commentId: string) => {
      const comment = comments?.find((c) => c.id === commentId);
      return comment?.replies || [];
    },
    [comments]
  );

  const isSubmitting =
    createCommentMutation.isPending ||
    replyCommentMutation.isPending ||
    resolveCommentMutation.isPending ||
    deleteCommentMutation.isPending;

  if (!showComments) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Comments</h3>
            <p className="text-xs text-gray-500">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowComments(false)}
          className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 group"
          aria-label="Close comments panel"
        >
          <X size={18} className="text-gray-500 group-hover:text-gray-700" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 mx-4 mt-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
        {isLoadingComments ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle
                size={24}
                className="text-gray-400 animate-pulse"
              />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">
              Loading comments...
            </h4>
          </div>
        ) : !comments.length ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle size={24} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">No comments yet</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Start a conversation by adding the first comment to this document.
            </p>
          </div>
        ) : null}

        {commentThreads.map((comment) => {
          const replies = getReplies(comment.id);

          return (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                  comment.isResolved
                    ? "bg-green-50 border-green-200 shadow-green-100/50"
                    : "bg-white border-gray-200 shadow-sm hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <CommentAvatar
                    avatar={comment.user?.avatar || comment.author?.avatar}
                    email={comment.user?.email || comment.author?.email || ""}
                  />
                  <div className="flex-1 min-w-0">
                    <CommentHeader
                      comment={comment}
                      currentUserId={currentUserId}
                      formatDate={formatDate}
                      handleDeleteComment={handleDeleteComment}
                    />
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {comment.content}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          setReplyTo(replyTo === comment.id ? null : comment.id)
                        }
                        className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center space-x-1.5 transition-all duration-200 font-medium"
                        aria-label="Reply to comment"
                      >
                        <Reply size={12} />
                        <span>Reply</span>
                      </button>
                      {!comment.isResolved && (
                        <button
                          onClick={() => handleResolveComment(comment.id)}
                          className="px-3 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg flex items-center space-x-1.5 transition-all duration-200 font-medium"
                          aria-label="Resolve comment"
                        >
                          <Check size={12} />
                          <span>Resolve</span>
                        </button>
                      )}
                      {comment.isResolved && (
                        <div className="px-3 py-1.5 text-xs text-green-700 bg-green-100 rounded-lg flex items-center space-x-1.5">
                          <Check size={12} />
                          <span>Resolved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-3 rounded-lg bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start space-x-2.5">
                        <CommentAvatar
                          avatar={reply.author?.avatar}
                          email={reply.author?.email}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-800">
                              {reply.author?.firstName} {reply.author?.lastName}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(new Date(reply.createdAt))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {replyTo === comment.id && (
                <div className="ml-8 mt-3">
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex space-x-3">
                      <CommentAvatar
                        avatar={currentUser.avatar}
                        email={currentUser.email || ""}
                      />
                      <div className="flex-1">
                        <textarea
                          ref={replyInputRef}
                          value={replyContent}
                          onChange={(e) => {
                            setReplyContent(e.target.value);
                            autoResize(e.target);
                          }}
                          onKeyDown={(e) =>
                            handleKeyPress(e, "reply", comment.id)
                          }
                          placeholder="Write a reply..."
                          className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50 focus:bg-white transition-colors"
                          rows={2}
                          maxLength={MAX_REPLY_LENGTH}
                          aria-label="Reply input"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {replyContent.length}/{MAX_REPLY_LENGTH} •
                            Ctrl+Enter to send
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setReplyTo(null)}
                              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                              aria-label="Cancel reply"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyContent.trim() || isSubmitting}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all duration-200 font-medium"
                              aria-label="Send reply"
                            >
                              <Send size={12} />
                              <span>
                                {isSubmitting ? "Sending..." : "Reply"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Comment Input */}
      <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex space-x-3">
            <CommentAvatar
              avatar={currentUser.avatar}
              email={currentUser.email || ""}
            />
            <div className="flex-1">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => handleKeyPress(e, "comment")}
                placeholder="Add a comment..."
                className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50 focus:bg-white transition-all duration-200"
                rows={3}
                maxLength={MAX_COMMENT_LENGTH}
                aria-label="New comment input"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    {newComment.length}/{MAX_COMMENT_LENGTH} • Ctrl+Enter to
                    send
                  </p>
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:shadow-none"
                  aria-label="Send comment"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? "Sending..." : "Send"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
