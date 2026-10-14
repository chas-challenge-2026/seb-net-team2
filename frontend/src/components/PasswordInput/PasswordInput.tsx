import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { useTranslation } from "react-i18next";

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
    placeholder,
    ...rest
}: PasswordInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] =
        useState(false);

    function handleVisibilityToggle() {
        setIsPasswordVisible((previous) => !previous);
    }

    const { t } = useTranslation();

    return (
        <div className={styles.passwordWrapper}>
            <input
                {...rest}
                id={id}
                name={name}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder ?? t("login.password")}
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
                        ? t("validation.hidePassword")
                        : t("validation.showPassword")
                }
                disabled={rest.disabled}
                aria-controls={id}
                aria-pressed={isPasswordVisible}
            >
                <span className={styles.iconWrapper} aria-hidden="true">
                    <EyeOff
                        className={`${styles.icon} ${!isPasswordVisible ? styles.iconVisible : ""}`}
                        size={20}
                        strokeWidth={1.8}
                    />
                    <Eye
                        className={`${styles.icon} ${isPasswordVisible ? styles.iconVisible : ""}`}
                        size={20}
                        strokeWidth={1.8}
                    />
                </span>
            </Button>
        </div>
    );
}