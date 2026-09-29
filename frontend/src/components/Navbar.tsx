import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { navigationLinks } from "../constants/routes";
import { NotificationBell } from "./Notifications/NotificationBell";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import { useAuth } from "../hooks/useAuth";

import styles from "./Navbar.module.css";

export function NavigationBar() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();

    return (
        <nav className={styles.navbar} aria-label={t("navigation.primary")}>
            <div className={styles.navbar__brand}>
                <Link
                    to={isAuthenticated ? "/dashboard" : "/login"}
                    className={styles.navbar__brandLink}
                    aria-label={t("navigation.goToDashboard")}
                >
                    <img
                        src="/seb-logo.svg"
                        alt="SEB"
                        className={styles.navbar__logo}
                    />
                </Link>
            </div>

            {isAuthenticated && (
                <ul className={styles.navbar__links}>
                    {navigationLinks.map(({ to, labelKey }) => (
                        <li key={to}>
                            <Link
                                to={to}
                                className={styles.navbar__link}
                                activeProps={{
                                    className: `${styles.navbar__link} ${styles["navbar__link--active"]}`,
                                }}
                            >
                                {t(labelKey)}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <div className={styles.navbar__actions}>
                <LanguageSelector />
                {isAuthenticated && <NotificationBell />}
            </div>
        </nav>
    );
}