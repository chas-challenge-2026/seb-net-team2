import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { focusField, type FieldErrors } from "./useFormValidation";
import styles from "./FormValidation.module.css";

export function FieldError({ id, errors }: { id: string; errors: FieldErrors }) {
    return errors[id] ? (
        <span id={`${id}-error`} className={styles.fieldError}>
            <TriangleAlert size={16} className={styles.errorIcon} aria-hidden="true" />
            <span>{errors[id]}</span>
        </span>
    ) : null;
}

export function ErrorSummary({ errors, attempt }: { errors: FieldErrors; attempt: number }) {
    const { t } = useTranslation();
    const entries = Object.entries(errors);
    return <div className={entries.length ? styles.announcements : styles.idle} aria-live="assertive" aria-atomic="true">
        {entries.length > 0 && <div key={attempt} className={styles.errorSummary}>
            <p><strong>{t("validation.summary", { count: entries.length })}</strong></p>
            <ul>{entries.map(([id, message]) => <li key={id}>
                <a href={`#${id}`} onClick={event => { event.preventDefault(); focusField(id); }}>{message}</a>
            </li>)}</ul>
        </div>}
    </div>;
}
