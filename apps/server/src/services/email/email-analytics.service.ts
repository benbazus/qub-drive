//import prisma from "@/config/database.config";
import prisma from "../../config/database.config";



export interface EmailSentEvent {
    messageId?: string;
    to: string | string[];
    subject: string;
    metadata?: Record<string, any>;
}

export interface EmailFailedEvent {
    to: string | string[];
    subject: string;
    error: string;
    metadata?: Record<string, any>;
}

export interface EmailAnalytics {
    totalSent: number;
    totalFailed: number;
    successRate: number;
    topEmailTypes: Array<{
        type: string;
        count: number;
    }>;
    recentActivity: Array<{
        date: string;
        sent: number;
        failed: number;
    }>;
}

export class EmailAnalyticsService {

    async trackEmail(event: {
        to: string | string[];
        subject: string;
        type?: string;
        status: 'sent' | 'failed';
        error?: string;
        messageId?: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        if (event.status === 'sent') {
            await this.trackEmailSent({
                messageId: event.messageId,
                to: event.to,
                subject: event.subject,
                metadata: { ...event.metadata, type: event.type }
            });
        } else {
            await this.trackEmailFailed({
                to: event.to,
                subject: event.subject,
                error: event.error || 'Unknown error',
                metadata: { ...event.metadata, type: event.type }
            });
        }
    }

    async trackEmailSent(event: EmailSentEvent): Promise<void> {
        await prisma.emailAnalytics.create({
            data: {
                messageId: event.messageId || null,
                recipients: Array.isArray(event.to) ? event.to.join(',') : event.to,
                subject: event.subject,
                status: 'sent',
                emailType: event.metadata?.['type'] ?? 'unknown',
                metadata: event.metadata! || {},
                sentAt: new Date(),
            },
        });
    }

    async trackEmailFailed(event: EmailFailedEvent): Promise<void> {
        await prisma.emailAnalytics.create({
            data: {
                recipients: Array.isArray(event.to) ? event.to.join(',') : event.to,
                subject: event.subject,
                status: 'failed',
                emailType: event.metadata?.['type'] ?? 'unknown',
                error: event.error,
                metadata: event.metadata || {},
                sentAt: new Date(),
            },
        });
    }

    async getAnalytics(days = 30): Promise<EmailAnalytics> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const [totalSent, totalFailed, topTypes, dailyActivity] = await Promise.all([
            prisma.emailAnalytics.count({
                where: { status: 'sent', sentAt: { gte: cutoffDate } },
            }),
            prisma.emailAnalytics.count({
                where: { status: 'failed', sentAt: { gte: cutoffDate } },
            }),
            prisma.emailAnalytics.groupBy({
                by: ['emailType'],
                where: { sentAt: { gte: cutoffDate } },
                _count: { emailType: true },
                orderBy: { _count: { emailType: 'desc' } },
                take: 10,
            }),
            this.getDailyAnalytics(cutoffDate),
        ]);

        const total = totalSent + totalFailed;
        const successRate = total > 0 ? (totalSent / total) * 100 : 0;

        return {
            totalSent,
            totalFailed,
            successRate,
            topEmailTypes: topTypes.map((type: { emailType: any; _count: { emailType: any; }; }) => ({
                type: type.emailType,
                count: type._count.emailType,
            })),
            recentActivity: dailyActivity,
        };
    }

    private async getDailyAnalytics(fromDate: Date): Promise<Array<{
        date: string;
        sent: number;
        failed: number;
    }>> {
        // This would typically use a raw SQL query for better performance
        const analytics = await prisma.emailAnalytics.findMany({
            where: { sentAt: { gte: fromDate } },
            select: {
                sentAt: true,
                status: true,
            },
        });

        const dailyStats = new Map<string, { sent: number; failed: number }>();

        analytics.forEach((record: { sentAt: { toISOString: () => string; }; status: string; }) => {
            const date = record.sentAt.toISOString().split('T')[0]!;
            if (!dailyStats.has(date)) {
                dailyStats.set(date, { sent: 0, failed: 0 });
            }

            const stats = dailyStats.get(date)!;
            if (record.status === 'sent') {
                stats.sent++;
            } else {
                stats.failed++;
            }
        });

        return Array.from(dailyStats.entries())
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
