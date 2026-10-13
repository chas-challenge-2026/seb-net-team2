import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import styles from "./InformationPage.module.css";

export function NotFoundPage() {
    const { t } = useTranslation();
    return <section className={styles.page}>
        <h1>{t("a11y.notFound")}</h1>
        <p>{t("a11y.notFoundDescription")}</p>
        <Link to="/login" className={styles.link}>{t("a11y.home")}</Link>
    </section>;
}
