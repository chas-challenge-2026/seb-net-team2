import { useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getUserById, updateUserById } from "../../../services/authService";
import type { ReadUser, UserRole } from "../../../schemas/userSchema";
import { AppError } from "../../../errors/AppError";

import Button from "../../../components/Button/Button";
import PasswordInput from "../../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import styles from "./EditUserDetails.module.css";

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AppError) return error.detail ?? error.message;
    return fallback;
}

type EditUserFormProps = {
    user: ReadUser;
};

function EditUserForm({ user }: EditUserFormProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>(user.role);

    const updateMutation = useMutation({
        mutationFn: () =>
            updateUserById(user.id, {
                name: name.trim(),
                email: email.trim(),
                role,
                ...(password && { password }),
            }),

        onSuccess: async (updatedUser) => {
            setName(updatedUser.name ?? "");
            setEmail(updatedUser.email ?? "");
            setRole(updatedUser.role ?? role);
            setPassword("");

            queryClient.setQueryData(["user", user.id], updatedUser);
            await queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        updateMutation.mutate();
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <h1>{t("users.edit.title")}</h1>
                <p>{t("users.edit.description")}</p>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("users.form.title")}</h2>
                    <p>{t("users.edit.formDescription")}</p>
                </div>

                <form className={styles.form} onSubmit={handleUpdateUser}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            {t("users.form.name")}
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            className={styles.input}
                            value={name}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            {t("users.form.email")}
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={styles.input}
                            value={email}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            {t("users.edit.newPassword")}
                        </label>

                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            placeholder={t("users.edit.passwordPlaceholder")}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="role" className={styles.label}>
                            {t("users.form.role")}
                        </label>

                        <select
                            id="role"
                            name="role"
                            className={styles.select}
                            value={role}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setRole(event.target.value as UserRole)}
                        >
                            <option value="User">{t("users.roles.User")}</option>
                            <option value="Initiator">{t("users.roles.Initiator")}</option>
                            <option value="Attestant">{t("users.roles.Attestant")}</option>
                            <option value="Admin">{t("users.roles.Admin")}</option>
                        </select>
                    </div>

                    {updateMutation.isSuccess && (
                        <div className={styles.success} role="status">
                            {t("users.edit.success")}
                        </div>
                    )}

                    {updateMutation.isError && (
                        <div className={styles.error} role="alert">
                            {getErrorMessage(updateMutation.error, t("users.errors.update"))}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link
                            to="/admin/users/$userId"
                            params={{ userId: user.id.toString() }}
                            className={styles.cancelButton}
                        >
                            {t("common.cancel")}
                        </Link>

                        <Button
                            type="submit"
                            variant="square"
                            size="medium"
                            disabled={updateMutation.isPending}
                            className={styles.formButton}
                        >
                            {updateMutation.isPending ? (
                                <span className={styles.loadingButton}>
                                    <LoadingWheel size="small" />
                                    {t("users.edit.saving")}
                                </span>
                            ) : (
                                t("users.edit.save")
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default function EditUserDetails() {
    const { t } = useTranslation();

    const { userId } = useParams({
        from: "/admin/users/$userId/edit",
    });

    const id = Number(userId);

    const { data: user, isPending, isError, error } = useQuery({
        queryKey: ["user", id],
        queryFn: () => getUserById(id),
    });

    if (isPending) {
        return (
            <div className={styles.loadingState} role="status" aria-live="polite">
                <LoadingWheel size="medium" />
                <p>{t("users.edit.loading")}</p>
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className={styles.error} role="alert">
                {getErrorMessage(error, t("users.errors.fetch"))}
            </div>
        );
    }

    return <EditUserForm key={user.id} user={user} />;
}