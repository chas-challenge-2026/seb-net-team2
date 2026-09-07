import { useState } from "react";
import type { FormEvent } from "react";

import { Link } from "@tanstack/react-router";

import Button from "../../components/Button/Button";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import styles from "./Register.module.css";

export default function CompanyRegistration() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        console.log({
            name: name.trim(),
            email: email.trim(),
            password,
            customerType: "company",
        });
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
        >
            <div className={styles.formGroup}>
                <label
                    htmlFor="company-register-name"
                    className={styles.label}
                >
                    Company name
                </label>

                <input
                    id="company-register-name"
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
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="company-register-email"
                    className={styles.label}
                >
                    Email
                </label>

                <input
                    id="company-register-email"
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
            </div>

            <div className={styles.formGroup}>
                <label
                    htmlFor="company-register-password"
                    className={styles.label}
                >
                    Password
                </label>

                <PasswordInput
                    id="company-register-password"
                    name="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                />
            </div>

            <div className={styles.actionGrid}>
                <Button
                    type="submit"
                    variant="square"
                    size="medium"
                    className={styles.formButton}
                >
                    Register
                </Button>

                <Link
                    to="/logga-in"
                    className={styles.loginLink}
                >
                    Already have an account? Log in.
                </Link>
            </div>
        </form>
    );
}