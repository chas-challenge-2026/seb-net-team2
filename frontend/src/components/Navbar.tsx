import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { UserRound } from "lucide-react";

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
                aria-label={t("navigation.goToDashboard")}
            >
                <img
                    src="/seb-logo.svg"
                    alt="SEB"
                    className={styles.navbar__logo}
                />
            </Link>

            <div className={styles.navbar__actions}>
                {isAuthenticated && user && (
                    <Link
                        to="/profil"
                        className={styles.navbar__user}
                        aria-label={`${user.name}, ${t(`users.roles.${user.role}`)}`}
                    >
                        <UserRound size={20} strokeWidth={2} aria-hidden="true" />

                        <span className={styles.navbar__userText}>
                            <span className={styles.navbar__userName}>
                                {user.name}
                            </span>

                            <span className={styles.navbar__userRole}>
                                {t(`users.roles.${user.role}`)}
                            </span>
                        </span>
                    </Link>
                )}

                {isAuthenticated && <NotificationBell />}

                <LanguageSelector />
            </div>
        </header>
    );
}