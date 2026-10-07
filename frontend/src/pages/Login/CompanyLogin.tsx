import { useFormValidation } from "../../components/FormValidation/useFormValidation";
import { FieldError, ErrorSummary } from "../../components/FormValidation/FormErrors";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

import Button from "../../components/Button/Button";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../components/LoadingState/LoadingWheel";
import { useAuth } from "../../hooks/useAuth";
import { getLoginErrorMessage } from "./loginErrorMessage";

import styles from "./Login.module.css";

export default function CompanyLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { t } = useTranslation();
    const validation = useFormValidation();
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
        if (!validation.validate(event.currentTarget)) return;

        if (!email.trim() || !password) {
            setError(t("login.missingCredentials"));
            return;
        }

        setError("");

        try {
            await login(email.trim(), password);
            await navigate({ to: "/dashboard" });
        } catch (error) {
            setError(getLoginErrorMessage(error, t));
        }
    }

    return (
        <form noValidate onChange={(event) => validation.clear((event.target as HTMLInputElement).id)} onSubmit={handleSubmit} className={styles.form}>
            <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
            <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="company-email" className={styles.label}>
                        {t("login.email")}
                    </label>

                    <input
                        id="company-email"
                        {...validation.fieldProps("company-email")}
                        name="email"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        required
                        placeholder={t("validation.emailExample")}
                        value={email}
                        onChange={handleEmail}
                        className={styles.input}
                        disabled={isLoggingIn}
                    />
                    <FieldError id="company-email" errors={validation.errors} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="company-password" className={styles.label}>
                        {t("login.password")}
                    </label>

                    <PasswordInput
                        id="company-password"
                        {...validation.fieldProps("company-password")}
                        name="password"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                        required
                        disabled={isLoggingIn}
                    />
                    <FieldError id="company-password" errors={validation.errors} />
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
                    {isLoggingIn ? (
                        <LoadingWheel size="small" />
                    ) : (
                        <span className={styles.buttonContent}>
                            <LogIn size={17} aria-hidden="true" />
                            {t("login.login")}
                        </span>
                    )}
                </Button>

                <p className={styles.error} aria-live="polite">
                    {error}
                </p>
            </div>
        </form>
    );
}
