import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../hooks/useAuth";
import { useReminderSettings, useUpdateReminderSettings } from "../../hooks/useReminderSettings";

import type { ReminderSettings as ReminderSettingsData } from "../../services/reminderService";
import { OVERDUE_AFTER_DAYS } from "../../utils/approvalReminders";

import Button from "../Button/Button";
import LoadingWheel from "../LoadingState/LoadingWheel";

import styles from "./ReminderSettings.module.css";

const DAY_OPTIONS = [1, 2, 3, 5];

function ReminderSettingsForm({ settings }: { settings: ReminderSettingsData }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const updateMutation = useUpdateReminderSettings();

    const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
    const [overdueAfterDays, setOverdueAfterDays] = useState(settings.overdueAfterDays);

    const hasChanges =
        emailEnabled !== settings.emailEnabled ||
        overdueAfterDays !== settings.overdueAfterDays;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        updateMutation.mutate({ emailEnabled, overdueAfterDays });
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={emailEnabled}
                    disabled={updateMutation.isPending}
                    onChange={(event) => {
                        setEmailEnabled(event.target.checked);
                        updateMutation.reset();
                    }}
                />
                {t("reminderSettings.emailEnabled")}
            </label>

            {user?.email && (
                <p className={styles.recipient}>
                    {t("reminderSettings.recipient")} <strong>{user.email}</strong>
                </p>
            )}

            <div className={styles.field}>
                <label htmlFor="reminder-days">{t("reminderSettings.remindAfter")}</label>

                <select
                    id="reminder-days"
                    aria-describedby="reminder-days-note"
                    value={overdueAfterDays}
                    disabled={!emailEnabled || updateMutation.isPending}
                    onChange={(event) => {
                        setOverdueAfterDays(Number(event.target.value));
                        updateMutation.reset();
                    }}
                >
                    {DAY_OPTIONS.map((days) => (
                        <option key={days} value={days}>
                            {t("reminderSettings.dayCount", { count: days })}
                        </option>
                    ))}
                </select>

                <span id="reminder-days-note" className={styles.note}>
                    {t("reminderSettings.inAppNote", { days: OVERDUE_AFTER_DAYS })}
                </span>
            </div>

            {updateMutation.isSuccess && (
                <p className={styles.success} role="status">
                    {t("reminderSettings.success")}
                </p>
            )}

            {updateMutation.isError && (
                <p className={styles.error} role="alert">
                    {t("reminderSettings.errors.save")}
                </p>
            )}

            <div className={styles.actions}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    disabled={!hasChanges || updateMutation.isPending}
                >
                    {updateMutation.isPending
                        ? t("reminderSettings.saving")
                        : t("reminderSettings.save")}
                </Button>
            </div>
        </form>
    );
}

export function ReminderSettings() {
    const { t } = useTranslation();
    const { data: settings, isPending, isError } = useReminderSettings();

    return (
        <section className={styles.section} aria-labelledby="reminder-settings-title">
            <h2 id="reminder-settings-title">{t("reminderSettings.title")}</h2>

            <p className={styles.intro}>
                {t("reminderSettings.description")}
            </p>

            {isPending && (
                <div className={styles.loading} role="status" aria-live="polite">
                    <LoadingWheel size="small" />
                    {t("reminderSettings.loading")}
                </div>
            )}

            {isError && (
                <p className={styles.error} role="alert">
                    {t("reminderSettings.errors.load")}
                </p>
            )}

            {settings && <ReminderSettingsForm settings={settings} />}
        </section>
    );
}