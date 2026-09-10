import { useState } from "react";
import type {
    ChangeEvent,
    FormEvent,
} from "react";

import { Link } from "@tanstack/react-router";

import Button from "../../components/Button/Button";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import styles from "./Login.module.css";

export default function PrivateLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

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

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!email.trim() || !password) {
            setError("Enter both email and password.");
            return;
        }

        setError("");

        console.log({
            email: email.trim(),
            password,
            customerType: "private",
        });
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
                    />
                </div>
            </div>

            <div className={styles.actionGrid}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    className={styles.formButton}
                >
                    Log in
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