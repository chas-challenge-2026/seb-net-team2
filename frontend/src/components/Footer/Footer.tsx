import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { informationPages } from "../../pages/Information/informationPages";
import styles from "./Footer.module.css";

const socialLinks = [
    { name: "Facebook", href: "https://facebook.com/sebsverige", path: "M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A25 25 0 0 0 15 1c-3 0-5 2-5 5v3H7v4h3v8z" },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/2527", path: "M4 9v12M4 3v.01M10 21V9m0 5a4 4 0 0 1 8 0v7" },
    { name: "Instagram", href: "https://www.instagram.com/sebstories/", path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm1-5h.01" },
    { name: "YouTube", href: "https://www.youtube.com/@sebsverige", path: "M5 5h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm5 4 5 3-5 3z" },
];

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <div>
                <p className={styles.title}>{t("footer.title")}</p>
                <p className={styles.description}>{t("footer.description")}</p>
                <nav className={styles.links} aria-label={t("information.navigation")}>
                    {informationPages.map(page => (
                        <Link key={page.id} to={page.to}>{t(`information.${page.id}.title`)}</Link>
                    ))}
                </nav>
                </div>
                <nav className={styles.socials} aria-label={t("footer.socialMedia")}>
                    {socialLinks.map(social => (
                        <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer"
                            aria-label={t("footer.socialLink", { name: social.name })}>
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d={social.path} />
                            </svg>
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
