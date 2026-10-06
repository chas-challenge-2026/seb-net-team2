import { updateUserSchema } from "../../../schemas/userSchema";
import { useFormValidation } from "../../../components/FormValidation/useFormValidation";
import { FieldError, ErrorSummary } from "../../../components/FormValidation/FormErrors";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleCheck, Pencil, Save, TriangleAlert } from "lucide-react";

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
    const validation = useFormValidation();
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
        const result = updateUserSchema.safeParse({ name: name.trim(), email: email.trim(), ...(password && { password }), role });
        const fieldErrors: Record<string, string> = {};
        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = String(issue.path[0]);
                const label = t(`users.form.${field}`);
                fieldErrors[field] = issue.code === "too_big"
                    ? t("validation.maxLength", { field: label, max: issue.maximum })
                    : field === "email" ? t("validation.email") : t("validation.required", { field: label });
            }
        }
        if (!validation.validate(event.currentTarget, fieldErrors) || !result.success) return;
        updateMutation.mutate();
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <Pencil size={27} strokeWidth={2} aria-hidden="true" />

                    <div>
                        <h1>{t("users.edit.title")}</h1>
                        <p>{t("users.edit.description")}</p>
                    </div>
                </div>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("users.form.title")}</h2>
                    <p>{t("users.edit.formDescription")}</p>
                </div>

                <form noValidate onChange={(event) => validation.clear((event.target as HTMLInputElement).id)} className={styles.form} onSubmit={handleUpdateUser}>
                    <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            {t("users.form.name")}
                        </label>

                        <input
                            id="name"
                            placeholder={t("validation.nameExample")}
                            {...validation.fieldProps("name")}
                            name="name"
                            type="text"
                            className={styles.input}
                            value={name}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                        <FieldError id="name" errors={validation.errors} />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            {t("users.form.email")}
                        </label>

                        <input
                            id="email"
                            placeholder={t("validation.emailExample")}
                            {...validation.fieldProps("email")}
                            name="email"
                            type="email"
                            className={styles.input}
                            value={email}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                        <FieldError id="email" errors={validation.errors} />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            {t("users.edit.newPassword")}
                        </label>

                        <PasswordInput
                            id="password"
                            {...validation.fieldProps("password")}
                            name="password"
                            value={password}
                            disabled={updateMutation.isPending}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            placeholder={t("users.edit.passwordPlaceholder")}
                        />
                        <FieldError id="password" errors={validation.errors} />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="role" className={styles.label}>
                            {t("users.form.role")}
                        </label>

                        <select
                            id="role"
                            {...validation.fieldProps("role")}
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
                        <FieldError id="role" errors={validation.errors} />
                    </div>

                    {updateMutation.isSuccess && (
                        <div className={styles.success} role="status">
                            <CircleCheck size={18} aria-hidden="true" />
                            <span>{t("users.edit.success")}</span>
                        </div>
                    )}

                    {updateMutation.isError && (
                        <div className={styles.error} role="alert">
                            <TriangleAlert size={18} aria-hidden="true" />
                            <span>{getErrorMessage(updateMutation.error, t("users.errors.update"))}</span>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link
                            to="/admin/users/$userId"
                            params={{ userId: user.id.toString() }}
                            className={styles.cancelButton}
                        >
                            <ArrowLeft size={17} aria-hidden="true" />
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
                                <span className={styles.buttonContent}>
                                    <Save size={18} aria-hidden="true" />
                                    {t("users.edit.save")}
                                </span>
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
                <TriangleAlert size={18} aria-hidden="true" />
                <span>{getErrorMessage(error, t("users.errors.fetch"))}</span>
            </div>
        );
    }

    return <EditUserForm key={user.id} user={user} />;
}
