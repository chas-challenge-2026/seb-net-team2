export type ReminderSettings = {
    emailEnabled: boolean
    overdueAfterDays: number
}

// Replace mock data with API requests when the backend has endpoints for reminder settings,
// e.g. GET/PUT /api/users/me/reminder-settings. 
let mockSettings: ReminderSettings = {
    emailEnabled: true,
    overdueAfterDays: 2,
}

export async function fetchReminderSettings(): Promise<ReminderSettings> {
    return { ...mockSettings }
}

export async function updateReminderSettings(settings: ReminderSettings): Promise<ReminderSettings> {
    mockSettings = { ...settings }
    return { ...mockSettings }
}
