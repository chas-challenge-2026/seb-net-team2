import { Link } from "@tanstack/react-router";

import {
    useQuery,
} from "@tanstack/react-query";

import {
    getApprovalLimits,
} from "../../../services/approvalLimitsService";

import Skeleton from "../../../components/LoadingState/Skeleton";

import styles from "./ApprovalLimits.module.css";

function ApprovalLimitSkeleton() {
    return (
        <div className={styles.limitRow}>
            <div className={styles.limitInfo}>
                <Skeleton
                    width="120px"
                    height="18px"
                />

                <Skeleton
                    width="220px"
                    height="14px"
                />
            </div>

            <div className={styles.approvals}>
                <Skeleton
                    width="40px"
                    height="18px"
                />

                <Skeleton
                    width="70px"
                    height="13px"
                />
            </div>

            <div className={styles.modified}>
                <Skeleton
                    width="90px"
                    height="13px"
                />

                <Skeleton
                    width="120px"
                    height="15px"
                />

                <Skeleton
                    width="140px"
                    height="12px"
                />
            </div>

            <Skeleton
                width="16px"
                height="24px"
            />
        </div>
    );
}

export default function ApprovalLimits() {
    const {
        data: limits = [],
        isPending,
        isError,
    } = useQuery({
        queryKey: ["approvalLimits"],
        queryFn: getApprovalLimits,
    });

    function formatAmount(amount: number) {
        return amount.toLocaleString(
            "sv-SE",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        );
    }

    function formatDate(date: string) {
        return new Date(
            date
        ).toLocaleString("sv-SE");
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Approval limits</h1>

                    <p>
                        Manage rules for required
                        payment approvals.
                    </p>
                </div>

                <Link
                    to="/admin/approval-limits/create"
                    className={
                        styles.createButton
                    }
                >
                    Create approval limit
                </Link>
            </header>

            <section
                className={styles.limitsSection}
            >
                <div className={styles.toolbar}>
                    <div>
                        <h2>
                            Approval rules
                        </h2>

                        {!isPending &&
                            !isError && (
                                <p>
                                    {limits.length}{" "}
                                    {limits.length === 1
                                        ? "rule"
                                        : "rules"}
                                </p>
                            )}
                    </div>
                </div>

                {isPending && (
                    <div
                        className={
                            styles.skeletonList
                        }
                        role="status"
                        aria-label="Loading approval limits"
                    >
                        {Array.from({
                            length: 5,
                        }).map(
                            (_, index) => (
                                <ApprovalLimitSkeleton
                                    key={index}
                                />
                            )
                        )}
                    </div>
                )}

                {isError && (
                    <div
                        className={
                            styles.errorState
                        }
                        role="alert"
                    >
                        Unable to load approval
                        limits.
                    </div>
                )}

                {!isPending &&
                    !isError &&
                    limits.length === 0 && (
                        <div
                            className={
                                styles.emptyState
                            }
                        >
                            <h2>
                                No approval limits
                            </h2>

                            <p>
                                Create an approval
                                limit to get
                                started.
                            </p>
                        </div>
                    )}

                {!isPending &&
                    !isError &&
                    limits.length > 0 && (
                        <div
                            className={
                                styles.limitList
                            }
                        >
                            {limits.map(
                                (limit) => (
                                    <Link
                                        key={limit.id}
                                        to="/admin/approval-limits/$limitId/edit"
                                        params={{
                                            limitId:
                                                limit.id.toString(),
                                        }}
                                        className={
                                            styles.limitLink
                                        }
                                    >
                                        <article
                                            className={
                                                styles.limitRow
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.limitInfo
                                                }
                                            >
                                                <strong
                                                    className={
                                                        styles.amount
                                                    }
                                                >
                                                    {formatAmount(
                                                        limit.minAmount
                                                    )}
                                                </strong>

                                                <span
                                                    className={
                                                        styles.description
                                                    }
                                                >
                                                    {
                                                        limit.description
                                                    }
                                                </span>
                                            </div>

                                            <div
                                                className={
                                                    styles.approvals
                                                }
                                            >
                                                <strong>
                                                    {
                                                        limit.requiredApprovals
                                                    }
                                                </strong>

                                                <span>
                                                    {limit.requiredApprovals ===
                                                        1
                                                        ? "approval"
                                                        : "approvals"}
                                                </span>
                                            </div>

                                            <div
                                                className={
                                                    styles.modified
                                                }
                                            >
                                                <span>
                                                    Last
                                                    modified
                                                </span>

                                                <strong>
                                                    {
                                                        limit.lastModifiedBy
                                                    }
                                                </strong>

                                                <small>
                                                    {formatDate(
                                                        limit.lastModifiedAt
                                                    )}
                                                </small>
                                            </div>

                                            <span
                                                className={
                                                    styles.chevron
                                                }
                                                aria-hidden="true"
                                            >
                                                ›
                                            </span>
                                        </article>
                                    </Link>
                                )
                            )}
                        </div>
                    )}
            </section>
        </div>
    );
}