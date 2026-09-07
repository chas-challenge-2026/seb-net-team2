import { useState } from "react";
import type { InputHTMLAttributes } from "react";

import Button from "../Button/Button";

import styles from "./PasswordInput.module.css";

type PasswordInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
> & {
    id: string;
};

export default function PasswordInput({
    id,
    name = "password",
    autoComplete = "current-password",
    placeholder = "Password",
    ...rest
}: PasswordInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] =
        useState(false);

    function handleVisibilityToggle() {
        setIsPasswordVisible((previous) => !previous);
    }

    return (
        <div className={styles.passwordWrapper}>
            <input
                {...rest}
                id={id}
                name={name}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={styles.input}
            />

            <Button
                type="button"
                variant="ghost"
                size="small"
                className={styles.visibilityButton}
                onClick={handleVisibilityToggle}
                aria-label={
                    isPasswordVisible
                        ? "Hide password"
                        : "Show password"
                }
                aria-pressed={isPasswordVisible}
            >
                {!isPasswordVisible ? (
                    <svg
                        className={styles.icon}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M3 3L21 21"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />

                        <path
                            d="M10.6 10.7A2 2 0 0 0 13.4 13.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />

                        <path
                            d="M9.9 4.2A10.8 10.8 0 0 1 12 4C17.5 4 21 9 21 9C20.2 10.2 19.2 11.4 17.9 12.6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />

                        <path
                            d="M6.6 6.6C4.4 8.1 3 10 3 10C3 10 6.5 15 12 15C13.4 15 14.8 14.7 16 14.2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                ) : (
                    <svg
                        className={styles.icon}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M3 12C3 12 6.5 7 12 7C17.5 7 21 12 21 12C21 12 17.5 17 12 17C6.5 17 3 12 3 12Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />

                        <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                    </svg>
                )}
            </Button>
        </div>
    );
}