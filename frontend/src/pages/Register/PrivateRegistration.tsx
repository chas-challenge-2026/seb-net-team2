import { useTranslation } from "react-i18next";
import { useFormValidation } from "../../components/FormValidation/useFormValidation";
import { FieldError, ErrorSummary } from "../../components/FormValidation/FormErrors";
import { useState } from "react";
import type { FormEvent } from "react";

import { Link } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";

import Button from "../../components/Button/Button";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import styles from "./Register.module.css";

export default function PrivateRegistration() {
    const { t } = useTranslation();
    const validation = useFormValidation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        if (!validation.validate(event.currentTarget)) return;

        console.log({
            name: name.trim(),
            email: email.trim(),
            password,
            customerType: "private",
        });
    }

    return (
        <form noValidate onChange={(event) => validation.clear((event.target as HTMLInputElement).id)}
            className={styles.form}
            onSubmit={handleSubmit}
        >
            <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
            <div className={styles.formGroup}>
                <label
                    htmlFor="private-register-name"
                    className={styles.label}
                >
                    {t("users.form.name")}
                </label>

                <input
                    id="private-register-name"
                    placeholder={t("validation.nameExample")}
                    {...validation.fieldProps("private-register-name")}
                    name="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    autoComplete="name"
                    required
                />
                <FieldError id="private-register-name" errors={validation.errors} />
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="private-register-email"
                    className={styles.label}
                >
                    {t("users.form.email")}
                </label>

                <input
                    id="private-register-email"
                    placeholder={t("validation.emailExample")}
                    {...validation.fieldProps("private-register-email")}
                    name="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    autoComplete="email"
                    inputMode="email"
                    required
                />
                <FieldError id="private-register-email" errors={validation.errors} />
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="private-register-password"
                    className={styles.label}
                >
                    {t("users.form.password")}
                </label>

                <PasswordInput
                    id="private-register-password"
                    {...validation.fieldProps("private-register-password")}
                    name="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                />
                <FieldError id="private-register-password" errors={validation.errors} />
            </div>

            <div className={styles.actionGrid}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    className={styles.formButton}
                >
                    <span className={styles.buttonContent}>
                        <UserPlus size={17} aria-hidden="true" />
                        {t("registration.submit")}
                    </span>
                </Button>

                <Link
                    to="/login"
                    className={styles.loginLink}
                >
                    <LogIn size={15} aria-hidden="true" />
                    {t("registration.login")}
                </Link>
            </div>
        </form>
    );
}
