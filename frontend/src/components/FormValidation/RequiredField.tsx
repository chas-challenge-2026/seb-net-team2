import styles from "./FormValidation.module.css";

export function RequiredMark() {
    return <span className={styles.requiredMark} aria-hidden="true" />;
}

