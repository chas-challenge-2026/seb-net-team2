import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Card from "../../../components/Card/Card";
import Skeleton from "../../../components/LoadingState/Skeleton";

import { getAllUsers } from "../../../services/authService";
import { getApprovalLimits } from "../../../services/approvalLimitsService";

import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
    const { t } = useTranslation();

    const {
        data: users = [],
        isPending: usersPending,
        isError: usersError,
    } = useQuery({
        queryKey: ["users"],
        queryFn: getAllUsers,
    });

    const {
        data: approvalLimits = [],
        isPending: limitsPending,
        isError: limitsError,
    } = useQuery({
        queryKey: ["approvalLimits"],
        queryFn: getApprovalLimits,
    });

    const isPending = usersPending || limitsPending;
    const isError = usersError || limitsError;
    const adminCount = users.filter((user) => user.role === "Admin").length;

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <h1>{t("admin.dashboard.title")}</h1>
                <p>{t("admin.dashboard.description")}</p>
            </header>

            {isError && (
                <div className={styles.error} role="alert">
                    {t("admin.dashboard.error")}
                </div>
            )}

            <section className={styles.stats} aria-label={t("admin.dashboard.statsLabel")}>
                <Card className={styles.statCard}>
                    <span>{t("admin.dashboard.users")}</span>

                    {isPending ? (
                        <Skeleton width="60px" height="36px" />
                    ) : (
                        <strong>{users.length}</strong>
                    )}

                    <Link to="/admin/users">
                        {t("admin.dashboard.viewUsers")} →
                    </Link>
                </Card>

                <Card className={styles.statCard}>
                    <span>{t("admin.dashboard.administrators")}</span>

                    {isPending ? (
                        <Skeleton width="60px" height="36px" />
                    ) : (
                        <strong>{adminCount}</strong>
                    )}

                    <Link to="/admin/users">
                        {t("admin.dashboard.viewUsers")} →
                    </Link>
                </Card>

                <Card className={styles.statCard}>
                    <span>{t("admin.dashboard.approvalLimits")}</span>

                    {isPending ? (
                        <Skeleton width="60px" height="36px" />
                    ) : (
                        <strong>{approvalLimits.length}</strong>
                    )}

                    <Link to="/admin/approval-limits">
                        {t("admin.dashboard.viewApprovalLimits")} →
                    </Link>
                </Card>
            </section>

            <section className={styles.quickActions}>
                <div>
                    <h2>{t("admin.dashboard.quickActions")}</h2>
                    <p>{t("admin.dashboard.quickActionsDescription")}</p>
                </div>

                <div className={styles.actions}>
                    <Link to="/admin/users/create" className={styles.actionLink}>
                        {t("admin.dashboard.createUser")}
                    </Link>

                    <Link
                        to="/admin/approval-limits/create"
                        className={styles.actionLink}
                    >
                        {t("admin.dashboard.createApprovalLimit")}
                    </Link>
                </div>
            </section>
        </div>
    );
}