import { RequiredMark } from "../../components/FormValidation/RequiredField";
import { useFormValidation } from "../../components/FormValidation/useFormValidation";
import { FieldError } from "../../components/FormValidation/FormErrors";
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

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { t } = useTranslation();
    const validation = useFormValidation({
        "login-email": { key: "login.emailRequired" },
        "login-password": { key: "login.passwordRequired" },
    });
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
            <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="login-email" className={styles.label}>
                        {t("login.email")}

                        <RequiredMark />
                    </label>

                    <input
                        id="login-email"
                        {...validation.fieldProps("login-email")}
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
                    <FieldError id="login-email" errors={validation.errors} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="login-password" className={styles.label}>
                        {t("login.password")}

                        <RequiredMark />
                    </label>

                    <PasswordInput
                        id="login-password"
                        {...validation.fieldProps("login-password")}
                        name="password"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                        required
                        disabled={isLoggingIn}
                    />
                    <FieldError id="login-password" errors={validation.errors} />
                </div>
            </div>

            <div className={styles.actionGrid}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    className={styles.formButton}
                    disabled={isLoggingIn}
                    aria-label={t("login.login")}
                    aria-busy={isLoggingIn}
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
