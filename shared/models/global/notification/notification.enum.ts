export const NotificationSeverity = {
    Error: 'error',
    Success: 'success',
    Info: 'info',
    Warn: 'warn'
} as const;

export type NotificationSeverity = typeof NotificationSeverity[keyof typeof NotificationSeverity];
