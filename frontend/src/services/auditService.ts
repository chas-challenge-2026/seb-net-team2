export interface AuditLogEntry {
    id: string
    timestamp: string
    user: string
    action: string
    entityType: string
    entityId: string
    description: string
}

// Replace mock data with API requests when the backend is ready.

export async function fetchAuditLog(): Promise<AuditLogEntry[]> {
    return [
        { id: '1', timestamp: '2026-09-15T09:12:00', user: 'Lisa Persson', action: 'APPROVE_PAYMENT', entityType: 'payment', entityId: '2', description: 'Payment approved and executed: 75000.00 SEK to SE8550000000054910000004' },
        { id: '2', timestamp: '2026-09-14T16:30:00', user: 'Johan Berg', action: 'APPROVE_STEP', entityType: 'payment', entityId: '5', description: 'Step 1 for payment 5 was approved' },
        { id: '3', timestamp: '2026-09-14T14:05:00', user: 'Johan Berg', action: 'REJECT_STEP', entityType: 'payment', entityId: '6', description: 'Step 1 for payment 6 was rejected' },
        { id: '4', timestamp: '2026-08-13T13:24:17', user: 'Lisa Persson', action: 'CREATE_PAYMENT', entityType: 'payment', entityId: '1', description: 'Created payment of 15000 SEK to SE8550000000054910000003' },
        { id: '5', timestamp: '2026-08-13T13:24:17', user: 'Lisa Persson', action: 'CREATE_PAYMENT', entityType: 'payment', entityId: '2', description: 'Created payment of 75000 SEK to SE8550000000054910000004' },
    ]
}
