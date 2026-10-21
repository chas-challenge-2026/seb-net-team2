import { Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";

import Card from "../../components/Card/Card";
import LoadingWheel from "../../components/LoadingState/LoadingWheel";

import LoginForm from "./LoginForm";
import { useAuth } from "../../hooks/useAuth";

import styles from "./Login.module.css";

export default function Login() {
    const { t } = useTranslation();
    const { user, isAuthenticated, isInitializing, sessionExpired } = useAuth();

    if (isInitializing) {
        return (
            <div className={styles.layout}>
                <LoadingWheel size="medium" announce />
            </div>
        );
    }

    if (isAuthenticated && user?.role === "Admin") {
        return <Navigate to="/admin" />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className={styles.layout}>
            <img src="/seb-wordmark-logo.svg" alt="SEB" className={styles.logo} />
            <Card variant="image" className={styles.centeredCard}>
                <header className={styles.welcome}>
                    <h1>{t("login.welcome")}</h1>
                    <p>{t("login.description")}</p>
                </header>

                <LoginForm />

                {sessionExpired && (
                    <p className={styles.sessionExpired} role="status">
                        <TriangleAlert size={17} aria-hidden="true" />
                        <span>{t("session.sessionExpired")}</span>
                    </p>
                )}
            </Card>
        </div>
    );
}
