import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Building2, Mail, Pencil, ShieldCheck, Trash2, TriangleAlert, UserRound } from "lucide-react";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import Modal from "../../../components/Modal/Modal";
import Skeleton from "../../../components/LoadingState/Skeleton";

import { AppError } from "../../../errors/AppError";
import { deleteUserById, getUserById } from "../../../services/authService";

import styles from "./UserDetails.module.css";

function UserDetailsSkeleton() {
    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.headerSkeleton}>
                    <Skeleton width="220px" height="32px" />
                    <Skeleton width="260px" height="14px" />
                </div>

                <div className={styles.headerActions}>
                    <Skeleton width="100px" height="40px" />
                    <Skeleton width="110px" height="40px" />
                </div>
            </header>

            <section className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                    <Skeleton width="180px" height="22px" />

                    <div className={styles.sectionDescriptionSkeleton}>
                        <Skeleton width="280px" height="14px" />
                    </div>
                </div>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <Skeleton width="50px" height="13px" />
                        <Skeleton width="160px" height="18px" />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton width="50px" height="13px" />
                        <Skeleton width="220px" height="18px" />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton width="40px" height="13px" />
                        <Skeleton width="80px" height="26px" radius="999px" />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton width="70px" height="13px" />
                        <Skeleton width="60px" height="18px" />
                    </div>
                </div>
            </section>
        </div>
    );
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AppError) return error.detail ?? error.message;
    return fallback;
}

export default function UserDetails() {
    const { t } = useTranslation();

    const { userId } = useParams({
        from: "/admin/users/$userId",
    });

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const {
        data: user,
        isPending,
        isError,
        error: loadError,
    } = useQuery({
        queryKey: ["user", Number(userId)],
        queryFn: () => getUserById(Number(userId)),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUserById,

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"] });
            await navigate({ to: "/admin/users" });
        },

        onError: () => setIsDeleteModalOpen(false),
    });

    function handleDeleteUser() {
        if (!user) return;
        deleteMutation.mutate(user.id);
    }

    if (isPending) {
        return (
            <div role="status" aria-label={t("users.details.loading")}>
                <UserDetailsSkeleton />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className={styles.errorState}>
                <TriangleAlert size={28} aria-hidden="true" />
                <p role="alert">
                    {getErrorMessage(loadError, t("users.errors.notFound"))}
                </p>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <UserRound size={28} strokeWidth={2} aria-hidden="true" />

                    <div>
                        <h1>{user.name}</h1>
                        <p>{t("users.details.description")}</p>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <Link
                        to="/admin/users/$userId/edit"
                        params={{ userId: user.id.toString() }}
                        className={styles.editButton}
                    >
                        <Pencil size={17} aria-hidden="true" />
                        {t("users.details.edit")}
                    </Link>

                    <Button
                        size="medium"
                        variant="danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <span className={styles.buttonContent}>
                            <Trash2 size={17} aria-hidden="true" />
                            {t("users.details.delete")}
                        </span>
                    </Button>
                </div>
            </header>

            {deleteMutation.isError && (
                <div className={styles.error} role="alert">
                    <TriangleAlert size={18} aria-hidden="true" />
                    <span>{getErrorMessage(deleteMutation.error, t("users.errors.delete"))}</span>
                </div>
            )}

            <section className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("users.form.title")}</h2>
                    <p>{t("users.details.sectionDescription")}</p>
                </div>

                <dl className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <dt>
                            <UserRound size={16} aria-hidden="true" />
                            {t("users.form.name")}
                        </dt>
                        <dd>{user.name}</dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>
                            <Mail size={16} aria-hidden="true" />
                            {t("users.form.email")}
                        </dt>
                        <dd>{user.email}</dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>
                            <ShieldCheck size={16} aria-hidden="true" />
                            {t("users.form.role")}
                        </dt>
                        <dd>
                            <span className={styles.roleBadge}>
                                {t(`users.roles.${user.role}`)}
                            </span>
                        </dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>
                            <Building2 size={16} aria-hidden="true" />
                            {t("users.details.tenantId")}
                        </dt>
                        <dd>{user.tenantId}</dd>
                    </div>
                </dl>
            </section>

            <Modal
                isOpen={isDeleteModalOpen}
                title={t("users.deleteModal.title")}
                onClose={() => {
                    if (!deleteMutation.isPending) setIsDeleteModalOpen(false);
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={deleteMutation.isPending}
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            {t("common.cancel")}
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={handleDeleteUser}
                        >
                            {deleteMutation.isPending ? (
                                <span className={styles.deletingContent}>
                                    <LoadingWheel size="small" />
                                    {t("users.deleteModal.deleting")}
                                </span>
                            ) : (
                                <span className={styles.buttonContent}>
                                    <Trash2 size={17} aria-hidden="true" />
                                    {t("users.details.delete")}
                                </span>
                            )}
                        </Button>
                    </>
                }
            >
                <div className={styles.deleteWarning}>
                    <TriangleAlert size={22} strokeWidth={2} aria-hidden="true" />

                    <div>
                        <p>
                            {t("users.deleteModal.confirm")} <strong>{user.name}</strong>?
                        </p>

                        <p>{t("users.deleteModal.warning")}</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}