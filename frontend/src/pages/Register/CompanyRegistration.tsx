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

export default function CompanyRegistration() {
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
            customerType: "company",
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
                    htmlFor="company-register-name"
                    className={styles.label}
                >
                    {t("registration.companyName")}
                </label>

                <input
                    id="company-register-name"
                    placeholder={t("validation.companyExample")}
                    {...validation.fieldProps("company-register-name")}
                    name="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    autoComplete="organization"
                    required
                />
                <FieldError id="company-register-name" errors={validation.errors} />
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="company-register-email"
                    className={styles.label}
                >
                    {t("users.form.email")}
                </label>

                <input
                    id="company-register-email"
                    placeholder={t("validation.emailExample")}
                    {...validation.fieldProps("company-register-email")}
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
                <FieldError id="company-register-email" errors={validation.errors} />
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="company-register-password"
                    className={styles.label}
                >
                    {t("users.form.password")}
                </label>

                <PasswordInput
                    id="company-register-password"
                    {...validation.fieldProps("company-register-password")}
                    name="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                />
                <FieldError id="company-register-password" errors={validation.errors} />
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
