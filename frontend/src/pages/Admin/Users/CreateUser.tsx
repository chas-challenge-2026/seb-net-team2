import { useState } from "react";
import type { FormEvent } from "react";

import Button from "../../../components/Button/Button";
import PasswordInput from "../../../components/PasswordInput/PasswordInput";

import { useAuth } from "../../../hooks/useAuth";

import { createUser } from "../../../services/authService";

import { AppError } from "../../../errors/AppError";

import type { UserRole } from "../../../schemas/userSchema";

import styles from "./CreateUser.module.css";

export default function CreateUser() {
    const { user } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [role, setRole] =
        useState<UserRole>("User");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            const createdUser = await createUser({
                tenantId: user.tenantId,
                name: name.trim(),
                email: email.trim(),
                password,
                role,
            });

            setSuccess(
                `${createdUser.name} was created successfully.`
            );

            setName("");
            setEmail("");
            setPassword("");
            setRole("User");
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );

                return;
            }

            setError(
                "Unable to create user."
            );
        }
    }

    return (
        <div className={styles.layout}>
            <form
                className={styles.form}
                onSubmit={handleSubmit}
            >
                <h1 className={styles.heading}>
                    Create user
                </h1>

                <div className={styles.formGroup}>
                    <label
                        htmlFor="name"
                        className={styles.label}
                    >
                        Name
                    </label>

                    <input
                        id="name"
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
                </div>

                <div className={styles.formGroup}>
                    <label
                        htmlFor="email"
                        className={styles.label}
                    >
                        Email
                    </label>

                    <input
                        id="email"
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
                        htmlFor="password"
                        className={styles.label}
                    >
                        Password
                    </label>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label
                        htmlFor="role"
                        className={styles.label}
                    >
                        Role
                    </label>

                    <select
                        id="role"
                        name="role"
                        className={styles.select}
                        value={role}
                        onChange={(event) =>
                            setRole(
                                event.target.value as UserRole
                            )
                        }
                    >
                        <option value="User">
                            User
                        </option>

                        <option value="Initiator">
                            Initiator
                        </option>

                        <option value="Attestant">
                            Attestant
                        </option>

                        <option value="Admin">
                            Admin
                        </option>
                    </select>
                </div>

                <div className={styles.actionGrid}>
                    <Button
                        type="submit"
                        variant="square"
                        size="medium"
                        className={styles.formButton}
                    >
                        Create user
                    </Button>

                    {success && (
                        <p
                            className={styles.success}
                            role="status"
                        >
                            {success}
                        </p>
                    )}

                    {error && (
                        <p
                            className={styles.error}
                            role="alert"
                        >
                            {error}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}