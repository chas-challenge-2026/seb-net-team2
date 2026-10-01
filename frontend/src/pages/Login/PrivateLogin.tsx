import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

import Button from "../../components/Button/Button";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../components/LoadingState/LoadingWheel";
import { useAuth } from "../../hooks/useAuth";
import { AppError } from "../../errors/AppError";

import styles from "./Login.module.css";

export default function PrivateLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { t } = useTranslation();
    const { login, isLoggingIn } = useAuth();
    const navigate = useNavigate();

    function handleEmail(event: ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
    }

    function handlePassword(event: ChangeEvent<HTMLInputElement>) {
        setPassword(event.target.value);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!email.trim() || !password) {
            setError(t("login.missingCredentials"));
            return;
        }

        setError("");

        try {
            await login(email.trim(), password);
            await navigate({ to: "/dashboard" });
        } catch (error) {
            if (error instanceof AppError) {
                setError(error.detail ?? error.message);
                return;
            }

            setError(t("login.generic"));
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="private-email" className={styles.label}>
                        {t("login.email")}
                    </label>

                    <input
                        id="private-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        required
                        placeholder={t("login.email")}
                        value={email}
                        onChange={handleEmail}
                        className={styles.input}
                        disabled={isLoggingIn}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="private-password" className={styles.label}>
                        {t("login.password")}
                    </label>

                    <PasswordInput
                        id="private-password"
                        name="password"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                        required
                        disabled={isLoggingIn}
                    />
                </div>
            </div>

            <div className={styles.actionGrid}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    className={styles.formButton}
                    disabled={isLoggingIn}
                >
                    {isLoggingIn ? <LoadingWheel size="small" /> : t("login.login")}
                </Button>

                <p className={styles.error} aria-live="polite">
                    {error}
                </p>
            </div>
        </form>
    );
}