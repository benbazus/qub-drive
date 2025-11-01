// src/services/email/file-upload-notification.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface FileUploadNotificationEmailData extends BaseEmailData {
    fileName: string;
    fileSize: string;
    fileType: string;
    uploadedBy: string;
    uploadedAt: Date;
    fileUrl?: string;
    folderName?: string;
    isShared?: boolean;
    shareUrl?: string;
    thumbnailUrl?: string;
}

export function renderFileUploadNotificationTemplate(data: FileUploadNotificationEmailData): string {
    const {
        fileName,
        fileSize,
        fileType,
        uploadedBy,
        uploadedAt,
        fileUrl,
        folderName,
        isShared,
        shareUrl,
        thumbnailUrl,
        recipientName
    } = data;

    const greeting = recipientName ? `Hello ${recipientName}` : 'Hello';

    const content = `
        <h2>${greeting}!</h2>
        <p><strong>${uploadedBy}</strong> has uploaded a new file${folderName ? ` to the "${folderName}" folder` : ''}.</p>
        
        <div class="file-info">
            ${thumbnailUrl ? `
                <img src="${thumbnailUrl}" alt="File preview" style="max-width: 200px; max-height: 150px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
            ` : `
                <div class="file-icon">📄</div>
            `}
            <h3 style="margin: 0 0 10px 0; color: #333;">${fileName}</h3>
            <p style="margin: 5px 0; color: #6c757d;">Size: ${fileSize}</p>
            <p style="margin: 5px 0; color: #6c757d;">Type: ${fileType}</p>
            <p style="margin: 5px 0; color: #6c757d;">Uploaded: ${uploadedAt.toLocaleString()}</p>
            ${folderName ? `<p style="margin: 5px 0; color: #6c757d;">Folder: ${folderName}</p>` : ''}
        </div>

        <div class="success-box">
            <p style="margin: 0 0 10px 0;"><strong>✅ Upload Successful</strong></p>
            <p style="margin: 0;">The file has been successfully uploaded and is now available in your file system.</p>
        </div>

        ${isShared && shareUrl ? `
            <div class="info-box">
                <p style="margin: 0 0 10px 0;"><strong>🔗 File is Shared</strong></p>
                <p style="margin: 0;">This file has been shared and is accessible via the link below:</p>
            </div>

            <div class="btn-center">
                <a href="${shareUrl}" class="btn btn-info">🔗 View Shared File</a>
            </div>
        ` : fileUrl ? `
            <div class="btn-center">
                <a href="${fileUrl}" class="btn">📁 View File</a>
            </div>
        ` : ''}

        <div class="info-box">
            <h4 style="margin: 0 0 10px 0;">What you can do now:</h4>
            <ul style="margin: 0 0 0 20px; padding: 0;">
                <li>View and download the file</li>
                <li>Share it with team members</li>
                <li>Add comments and collaborate</li>
                <li>Move it to different folders</li>
                <li>Set access permissions</li>
            </ul>
        </div>

        ${fileUrl ? `
            <div class="link-fallback">
                <p>Direct link to file:</p>
                <p><a href="${fileUrl}">${fileUrl}</a></p>
            </div>
        ` : ''}
    `;

    return renderBaseTemplate('📤 New File Uploaded', content, data);
}