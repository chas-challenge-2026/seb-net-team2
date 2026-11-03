import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { NotificationBell } from "./Notifications/NotificationBell";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import { useAuth } from "../hooks/useAuth";

import styles from "./Navbar.module.css";

export function NavigationBar() {
    const { t } = useTranslation();
    const { isAuthenticated, user } = useAuth();

    const homeRoute = user?.role === "Admin" ? "/admin" : "/dashboard";

    return (
        <header className={styles.navbar}>
            <Link
                to={isAuthenticated ? homeRoute : "/login"}
                className={styles.navbar__brandLink}
                aria-label={`SEB – ${t("navigation.goToDashboard")}`}
            >
                <img
                    src="/seb-logo.svg"
                    alt="SEB"
                    className={styles.navbar__logo}
                />
            </Link>

            <div className={styles.navbar__actions}>
                <LanguageSelector />
                {isAuthenticated && <NotificationBell />}

            </div>
        </header>
    );
}
