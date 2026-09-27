import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchReminderSettings,
    updateReminderSettings,
    type ReminderSettings,
} from "../services/reminderService";

export const REMINDER_SETTINGS_QUERY_KEY = ['reminderSettings']

export function useReminderSettings() {
    return useQuery({
        queryKey: REMINDER_SETTINGS_QUERY_KEY,
        queryFn: fetchReminderSettings,
    })
}

export function useUpdateReminderSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (settings: ReminderSettings) => updateReminderSettings(settings),
        onSuccess: (savedSettings) => {
            queryClient.setQueryData(REMINDER_SETTINGS_QUERY_KEY, savedSettings)
        },
    })
}
