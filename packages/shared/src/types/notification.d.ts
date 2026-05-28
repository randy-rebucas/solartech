export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationEvent = 'fault_alert' | 'maintenance_reminder' | 'billing_alert' | 'ai_anomaly' | 'proposal_approved' | 'proposal_rejected' | 'installation_complete' | 'device_offline' | 'payment_received' | 'payment_overdue' | 'report_ready' | 'system_update';
export interface Notification {
    id: string;
    userId: string;
    organizationId: string;
    event: NotificationEvent;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Record<string, string>;
    isRead: boolean;
    readAt?: string;
    sentAt?: string;
    createdAt: string;
}
