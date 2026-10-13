import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { informationPages, informationSections, type InformationPageId } from "./informationPages";
import styles from "./InformationPage.module.css";

export function InformationPage({ page }: { page: InformationPageId }) {
    const { t } = useTranslation();
    const prefix = `information.${page}`;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>{t(`${prefix}.title`)}</h1>
                <p className={styles.intro}>{t(`${prefix}.intro`)}</p>
            </header>

            <nav className={styles.navigation} aria-label={t("information.navigation")}>
                {informationPages.map(item => (
                    <Link key={item.id} to={item.to} aria-current={item.id === page ? "page" : undefined}
                        className={styles.link}>
                        {t(`information.${item.id}.title`)}
                    </Link>
                ))}
            </nav>

            <article className={styles.article} aria-label={t(`${prefix}.title`)}>
                {informationSections[page].map(section => (
                    <section key={section} className={styles.section}>
                        <h2>{t(`${prefix}.sections.${section}.title`)}</h2>
                        <p>{t(`${prefix}.sections.${section}.body`)}</p>
                    </section>
                ))}
                {page === "privacy" && (
                    <p className={styles.source}>
                        <a href="https://www.imy.se/privatperson/dataskydd/dina-rattigheter/">
                            {t("information.privacy.source")}
                        </a>
                    </p>
                )}
                {page === "storage" && (
                    <p className={styles.source}>
                        <a href="https://www.pts.se/internet-och-telefoni/kakor-cookies/">
                            {t("information.storage.source")}
                        </a>
                    </p>
                )}
            </article>
        </div>
    );
}
