import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useReminderSettings, useUpdateReminderSettings } from '../../hooks/useReminderSettings'
import type { ReminderSettings as ReminderSettingsData } from '../../services/reminderService'
import Button from '../Button/Button'
import LoadingWheel from '../LoadingState/LoadingWheel'
import styles from './ReminderSettings.module.css'

const DAY_OPTIONS = [1, 2, 3, 5]

function ReminderSettingsForm({ settings }: { settings: ReminderSettingsData }) {
    const { user } = useAuth()
    const updateMutation = useUpdateReminderSettings()
    const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled)
    const [overdueAfterDays, setOverdueAfterDays] = useState(settings.overdueAfterDays)

    const hasChanges =
        emailEnabled !== settings.emailEnabled || overdueAfterDays !== settings.overdueAfterDays

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        updateMutation.mutate({ emailEnabled, overdueAfterDays })
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={emailEnabled}
                    disabled={updateMutation.isPending}
                    onChange={(event) => {
                        setEmailEnabled(event.target.checked)
                        updateMutation.reset()
                    }}
                />
                Send me an email when a payment has waited too long for my approval
            </label>

            {user?.email && (
                <p className={styles.recipient}>
                    Reminders are sent to <strong>{user.email}</strong>
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="reminder-days">Remind me after</label>
                <select
                    id="reminder-days"
                    value={overdueAfterDays}
                    disabled={!emailEnabled || updateMutation.isPending}
                    onChange={(event) => {
                        setOverdueAfterDays(Number(event.target.value))
                        updateMutation.reset()
                    }}
                >
                    {DAY_OPTIONS.map((days) => (
                        <option key={days} value={days}>
                            {days} {days === 1 ? 'day' : 'days'}
                        </option>
                    ))}
                </select>
            </div>

            {updateMutation.isSuccess && (
                <p className={styles.success} role="status">Reminder settings saved.</p>
            )}

            {updateMutation.isError && (
                <p className={styles.error} role="alert">Unable to save reminder settings.</p>
            )}

            <div className={styles.actions}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    disabled={!hasChanges || updateMutation.isPending}
                >
                    {updateMutation.isPending ? 'Saving...' : 'Save settings'}
                </Button>
            </div>
        </form>
    )
}

export function ReminderSettings() {
    const { data: settings, isPending, isError } = useReminderSettings()

    return (
        <section className={styles.section} aria-labelledby="reminder-settings-title">
            <h2 id="reminder-settings-title">Approval reminders</h2>
            <p className={styles.intro}>
                Get an email when payments are waiting for your approval, so they don't get stuck.
            </p>

            {isPending && (
                <div className={styles.loading} role="status" aria-live="polite">
                    <LoadingWheel size="small" />
                    Loading settings...
                </div>
            )}

            {isError && (
                <p className={styles.error} role="alert">Unable to load reminder settings.</p>
            )}

            {settings && <ReminderSettingsForm settings={settings} />}
        </section>
    )
}
