import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardCheck, ClipboardList, CreditCard, House } from "lucide-react";
import type { ReactNode } from "react";
import type { AuthUser } from "../schemas/userSchema";
import { useTranslation } from "react-i18next";

import { useApprovals } from "../hooks/useApprovals";
import { daysWaiting, dueStatus, isOverdue, OVERDUE_AFTER_DAYS } from "../utils/approvalReminders";
import { ProfileMenu } from "../components/ProfileMenu/ProfileMenu";
import styles from "./AdminWorkspace.module.css";

const adminSections = [
    { to: "/admin", label: "admin.navigation.overview", icon: House },
    { to: "/attestkorg", label: "sidebar.approvalInbox", icon: ClipboardCheck },
    { to: "/granskningslogg", label: "sidebar.auditLog", icon: ClipboardList },
] as const;

// The attestant uses the same workspace with overview, approvals and the audit log.
const attestantSections = [
    { to: "/dashboard", label: "sidebar.dashboard", icon: House },
    { to: "/attestkorg", label: "sidebar.approvalInbox", icon: ClipboardCheck },
    { to: "/granskningslogg", label: "sidebar.auditLog", icon: ClipboardList },
] as const;

const initiatorSections = [
    { to: "/dashboard", label: "sidebar.dashboard", icon: House },
    { to: "/ny-betalning", label: "sidebar.newPayment", icon: CreditCard },
] as const;

const sectionsByVariant = {
    admin: adminSections,
    attestant: attestantSections,
    initiator: initiatorSections,
} as const;

export function AdminWorkspace({ children, organization, user, variant = "admin" }: {
    children: ReactNode;
    organization?: string;
    user?: Pick<AuthUser, "name" | "role">;
    variant?: "admin" | "attestant" | "initiator";
}) {
    const { t } = useTranslation();
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const { data: approvals } = useApprovals(variant !== "initiator");
    const pending = approvals?.length ?? 0;
    const overdue = (approvals ?? []).filter((approval) =>
        isOverdue(approval) || dueStatus(approval) === "pastDue"
    ).length;
    const needsAttention = (approvals ?? []).some((approval) =>
        daysWaiting(approval) >= OVERDUE_AFTER_DAYS
        || ["today", "tomorrow"].includes(dueStatus(approval) ?? "")
    );
    const severity = overdue > 0 ? "urgent" : needsAttention ? "warning" : "normal";
    const badgeLabel = overdue > 0
        ? t("sidebar.approvalsWithOverdue", { pending, overdue })
        : t(needsAttention ? "sidebar.approvalsNeedAttention" : "sidebar.approvalsPending", { pending });
    const sections = sectionsByVariant[variant];

    return (
        <div className={styles.workspace}>
            <div className={styles.topline}>
                {variant !== "initiator" && <span>{organization || t("sidebar.admin")}</span>}
                <div className={styles.accountActions}>
                    <ProfileMenu user={user} />
                </div>
            </div>

            <div className={styles.surface}>
                <nav
                    className={`${styles.navigation} ${variant === "initiator" ? styles.twoSections : ""}`}
                    aria-label={t("sidebar.navigationLinks")}
                >
                    {sections.map(({ to, label, icon: Icon }) => {
                        const active = pathname.replace(/\/$/, "") === to
                            || pathname.startsWith(`${to}/`);

                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`${styles.navLink} ${active ? styles.active : ""}`}
                                aria-current={active ? "page" : undefined}
                            >
                                <Icon size={18} aria-hidden="true" />
                                <span>{t(label)}</span>
                                {to === "/attestkorg" && pending > 0 && (
                                    <span className={styles.count} data-severity={severity} aria-label={badgeLabel} title={badgeLabel}>
                                        {pending}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.routeContent}>{children}</div>
            </div>
        </div>
    );
}
