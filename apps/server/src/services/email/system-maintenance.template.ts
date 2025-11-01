// src/services/email/system-maintenance.template.ts

import { renderBaseTemplate, BaseEmailData } from './base-template';

export interface SystemMaintenanceEmailData extends BaseEmailData {
    maintenanceType: 'scheduled' | 'emergency' | 'completed';
    startTime: Date;
    endTime?: Date;
    duration?: string;
    affectedServices: string[];
    reason: string;
    impact: 'low' | 'medium' | 'high';
    statusPageUrl?: string;
    alternativeActions?: string[];
}

export function renderSystemMaintenanceTemplate(data: SystemMaintenanceEmailData): string {
    const {
        maintenanceType,
        startTime,
        endTime,
        duration,
        affectedServices,
        reason,
        impact,
        statusPageUrl,
        alternativeActions,
        recipientName
    } = data;

    const greeting = recipientName ? `Hello ${recipientName}` : 'Hello';
    const isCompleted = maintenanceType === 'completed';
    const isEmergency = maintenanceType === 'emergency';

    const impactColor = {
        low: '#28a745',
        medium: '#ffc107',
        high: '#dc3545'
    }[impact];

    const impactIcon = {
        low: '🟢',
        medium: '🟡',
        high: '🔴'
    }[impact];

    const content = `
        <h2>${greeting}!</h2>
        
        ${isCompleted ? `
            <div class="success-box">
                <p style="margin: 0 0 10px 0;"><strong>✅ Maintenance Completed</strong></p>
                <p style="margin: 0;">System maintenance has been successfully completed. All services are now fully operational.</p>
            </div>
        ` : `
            <div class="${isEmergency ? 'warning-box' : 'info-box'}">
                <p style="margin: 0 0 10px 0;">
                    <strong>${isEmergency ? '🚨 Emergency' : '🔧 Scheduled'} System Maintenance</strong>
                </p>
                <p style="margin: 0;">
                    We ${isCompleted ? 'have completed' : 'will be performing'} system maintenance 
                    ${isEmergency ? 'due to an urgent issue' : 'to improve our services'}.
                </p>
            </div>
        `}

        <div class="info-box">
            <h3 style="margin: 0 0 15px 0;">Maintenance Details:</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${maintenanceType.charAt(0).toUpperCase() + maintenanceType.slice(1)} Maintenance</p>
            <p style="margin: 5px 0;"><strong>Start Time:</strong> ${startTime.toLocaleString()}</p>
            ${endTime ? `<p style="margin: 5px 0;"><strong>End Time:</strong> ${endTime.toLocaleString()}</p>` : ''}
            ${duration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>` : ''}
            <p style="margin: 5px 0;">
                <strong>Impact Level:</strong> 
                <span style="color: ${impactColor}; font-weight: bold;">
                    ${impactIcon} ${impact.toUpperCase()}
                </span>
            </p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
        </div>

        <div class="warning-box">
            <h4 style="margin: 0 0 10px 0;">Affected Services:</h4>
            <ul style="margin: 0 0 0 20px; padding: 0;">
                ${affectedServices.map(service => `<li>${service}</li>`).join('')}
            </ul>
        </div>

        ${!isCompleted ? `
            <h3>What to expect:</h3>
            <div class="info-box">
                <ul style="margin: 0 0 0 20px; padding: 0;">
                    <li>Some services may be temporarily unavailable</li>
                    <li>File uploads and downloads may be slower</li>
                    <li>You may experience brief connection interruptions</li>
                    <li>Scheduled emails might be delayed</li>
                </ul>
            </div>

            ${alternativeActions && alternativeActions.length > 0 ? `
                <h3>Alternative Actions:</h3>
                <div class="success-box">
                    <ul style="margin: 0 0 0 20px; padding: 0;">
                        ${alternativeActions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        ` : `
            <div class="success-box">
                <h4 style="margin: 0 0 10px 0;">🎉 What's New:</h4>
                <ul style="margin: 0 0 0 20px; padding: 0;">
                    <li>Improved system performance</li>
                    <li>Enhanced security measures</li>
                    <li>Bug fixes and stability improvements</li>
                    <li>New features and functionality</li>
                </ul>
            </div>
        `}

        ${statusPageUrl ? `
            <div class="btn-center">
                <a href="${statusPageUrl}" class="btn btn-info">📊 View Status Page</a>
            </div>

            <div class="link-fallback">
                <p>Status page link:</p>
                <p><a href="${statusPageUrl}">${statusPageUrl}</a></p>
            </div>
        ` : ''}

        <div class="info-box">
            <p style="margin: 0;"><strong>Need Help?</strong></p>
            <p style="margin: 10px 0 0 0;">
                If you experience any issues ${isCompleted ? 'after the maintenance' : 'during the maintenance window'}, 
                please contact our support team. We appreciate your patience and understanding.
            </p>
        </div>

        ${!isCompleted ? `
            <div class="warning-box">
                <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Save any work in progress before the maintenance window begins.</p>
            </div>
        ` : ''}
    `;

    const title = isCompleted 
        ? '✅ Maintenance Completed' 
        : `${isEmergency ? '🚨' : '🔧'} System Maintenance ${isEmergency ? 'Alert' : 'Notice'}`;

    return renderBaseTemplate(title, content, data);
}