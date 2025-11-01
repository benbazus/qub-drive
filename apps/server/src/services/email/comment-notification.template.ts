import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface CommentNotificationEmailData extends BaseEmailData {
  fileName: string;
  commenterName: string;
  comment: string;
  shareUrl: string;
  commentedAt?: Date;
  isReply?: boolean;
  parentComment?: string;
}

export function renderCommentNotificationTemplate(data: CommentNotificationEmailData): string {
  const {
    fileName,
    commenterName,
    comment,
    shareUrl,
    commentedAt,
    isReply,
    parentComment,
    recipientName
  } = data;

  const commentDate = commentedAt
    ? new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(commentedAt)
    : 'just now';

  const actionText = isReply ? 'replied to a comment' : 'added a comment';
  const truncatedComment = comment.length > 200 ? comment.substring(0, 200) + '...' : comment;

  const content = `
      <h2>New Activity${recipientName ? ` for ${recipientName}` : ''}</h2>
      <p><strong>${commenterName}</strong> ${actionText} on your shared file.</p>
      
      <div class="file-info">
        <div class="file-icon">📄</div>
        <h3 style="margin: 0 0 10px 0; color: #333;">${fileName}</h3>
        <p style="margin: 5px 0; color: #6c757d;">Activity: ${commentDate}</p>
      </div>
  
      ${isReply && parentComment ? `
        <div class="info-box">
          <p style="margin: 0 0 10px 0;"><strong>💬 Replying to:</strong></p>
          <p style="margin: 0; font-style: italic; color: #6c757d;">"${parentComment.substring(0, 100)}${parentComment.length > 100 ? '...' : ''}"</p>
        </div>
      ` : ''}
  
      <div class="comment-box">
        <p style="margin: 0 0 10px 0;"><strong>💬 ${commenterName} ${isReply ? 'replied' : 'commented'}:</strong></p>
        <p style="margin: 0;">"${truncatedComment}"</p>
      </div>
  
      <p>Click the button below to view the file and ${isReply ? 'continue the conversation' : 'respond to the comment'}:</p>
      
      <div class="btn-center">
        <a href="${shareUrl}" class="btn btn-info">💬 View & Respond</a>
      </div>
  
      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${shareUrl}">${shareUrl}</a></p>
      </div>
    `;

  return renderBaseTemplate('💬 New Comment', content, data);
}