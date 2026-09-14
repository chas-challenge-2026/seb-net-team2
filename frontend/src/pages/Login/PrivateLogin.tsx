import { useState } from "react";
import type {
    ChangeEvent,
    FormEvent,
} from "react";

import {
    Link,
    useNavigate,
} from "@tanstack/react-router";

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

    const {
        login,
        isLoggingIn,
    } = useAuth();

    const navigate = useNavigate();

    function handleEmail(
        event: ChangeEvent<HTMLInputElement>
    ) {
        setEmail(event.target.value);
    }

    function handlePassword(
        event: ChangeEvent<HTMLInputElement>
    ) {
        setPassword(event.target.value);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!email.trim() || !password) {
            setError("Enter both email and password.");
            return;
        }

        setError("");

        try {
            await login(
                email.trim(),
                password
            );

            await navigate({
                to: "/overview",
            });
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );
                return;
            }

            setError("Something went wrong.");
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={styles.form}
        >
            <div className={styles.inputGrid}>
                <div className={styles.formGroup}>
                    <label
                        htmlFor="private-email"
                        className={styles.label}
                    >
                        Email
                    </label>

                    <input
                        id="private-email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        required
                        placeholder="Email"
                        value={email}
                        onChange={handleEmail}
                        className={styles.input}
                        disabled={isLoggingIn}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label
                        htmlFor="private-password"
                        className={styles.label}
                    >
                        Password
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
                    {isLoggingIn ? (
                        <LoadingWheel size="small" />
                    ) : (
                        "Log in"
                    )}
                </Button>

                <Link
                    to="/register"
                    className={styles.register}
                >
                    Don't have an account? Register here.
                </Link>

                <p
                    className={styles.error}
                    aria-live="polite"
                >
                    {error}
                </p>
            </div>
        </form>
    );
}