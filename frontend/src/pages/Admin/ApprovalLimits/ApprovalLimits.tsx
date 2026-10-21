import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    Banknote,
    ChevronRight,
    Clock3,
    Plus,
    ShieldCheck,
    UsersRound,
} from "lucide-react";

import { getApprovalLimits } from "../../../services/approvalLimitsService";
import Skeleton from "../../../components/LoadingState/Skeleton";

import styles from "./ApprovalLimits.module.css";

function ApprovalLimitSkeleton() {
    return (
        <div className={styles.limitRow}>
            <div className={styles.limitInfo}>
                <Skeleton width="120px" height="18px" />
                <Skeleton width="220px" height="14px" />
            </div>

            <div className={styles.approvals}>
                <Skeleton width="40px" height="18px" />
                <Skeleton width="70px" height="13px" />
            </div>

            <div className={styles.modified}>
                <Skeleton width="90px" height="13px" />
                <Skeleton width="120px" height="15px" />
                <Skeleton width="140px" height="12px" />
            </div>

            <Skeleton width="16px" height="24px" />
        </div>
    );
}

export default function ApprovalLimits() {
    const { t, i18n } = useTranslation();

    const {
        data: limits = [],
        isPending,
        isError,
    } = useQuery({
        queryKey: ["approvalLimits"],
        queryFn: getApprovalLimits,
    });

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    function formatAmount(amount: number) {
        return amount.toLocaleString(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString(locale);
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div>
                    <div className={styles.titleRow}>
                        <ShieldCheck size={26} strokeWidth={2} aria-hidden="true" />
                        <h1>{t("approvalLimits.list.title")}</h1>
                    </div>

                    <p>{t("approvalLimits.list.description")}</p>
                </div>

                <Link
                    to="/admin/approval-limits/create"
                    className={styles.createButton}
                >
                    <Plus size={18} strokeWidth={2} aria-hidden="true" />
                    {t("approvalLimits.list.create")}
                </Link>
            </header>

            <section className={styles.limitsSection}>
                <div className={styles.toolbar}>
                    <div>
                        <h2>{t("approvalLimits.list.rules")}</h2>

                        {!isPending && !isError && (
                            <p>
                                {t("approvalLimits.list.ruleCount", {
                                    count: limits.length,
                                })}
                            </p>
                        )}
                    </div>
                </div>

                {isPending && (
                    <div
                        className={styles.skeletonList}
                        role="status"
                        aria-label={t("approvalLimits.list.loading")}
                    >
                        {Array.from({ length: 5 }).map((_, index) => (
                            <ApprovalLimitSkeleton key={index} />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className={styles.errorState} role="alert">
                        {t("approvalLimits.list.errors.load")}
                    </div>
                )}

                {!isPending && !isError && limits.length === 0 && (
                    <div className={styles.emptyState}>
                        <ShieldCheck size={32} strokeWidth={1.75} aria-hidden="true" />
                        <h2>{t("approvalLimits.list.empty.title")}</h2>
                        <p>{t("approvalLimits.list.empty.description")}</p>
                    </div>
                )}

                {!isPending && !isError && limits.length > 0 && (
                    <div className={styles.limitList}>
                        {limits.map((limit) => (
                            <Link
                                key={limit.id}
                                to="/admin/approval-limits/$limitId/edit"
                                params={{ limitId: limit.id.toString() }}
                                className={styles.limitLink}
                            >
                                <article className={styles.limitRow}>
                                    <div className={styles.limitInfo}>
                                        <div className={styles.valueRow}>
                                            <Banknote
                                                size={18}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            />

                                            <strong className={styles.amount}>
                                                {formatAmount(limit.minAmount)}
                                            </strong>
                                        </div>

                                        <span className={styles.description}>
                                            {limit.description}
                                        </span>
                                    </div>

                                    <div className={styles.approvals}>
                                        <div className={styles.valueRow}>
                                            <UsersRound
                                                size={18}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            />

                                            <strong>
                                                {limit.requiredApprovals}
                                            </strong>
                                        </div>

                                        <span>
                                            {t("approvalLimits.list.approvalCount", {
                                                count: limit.requiredApprovals,
                                            })}
                                        </span>
                                    </div>

                                    <div className={styles.modified}>
                                        <span className={styles.modifiedLabel}>
                                            <Clock3
                                                size={15}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            />
                                            {t("approvalLimits.list.lastModified")}
                                        </span>

                                        <strong>{limit.lastModifiedBy}</strong>
                                        <small>{formatDate(limit.lastModifiedAt)}</small>
                                    </div>

                                    <ChevronRight
                                        className={styles.chevron}
                                        size={22}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    />
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}