import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardCheck, ClipboardList, House, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useApprovals } from "../hooks/useApprovals";
import { countOverdue } from "../utils/approvalReminders";
import styles from "./AdminWorkspace.module.css";

const adminSections = [
    { to: "/admin", label: "admin.navigation.overview", icon: House },
    { to: "/attestkorg", label: "sidebar.approvalInbox", icon: ClipboardCheck },
    { to: "/granskningslogg", label: "sidebar.auditLog", icon: ClipboardList },
] as const;

// The attestant uses the same workspace with only their two pages.
const attestantSections = [
    { to: "/dashboard", label: "sidebar.dashboard", icon: House },
    { to: "/attestkorg", label: "sidebar.approvalInbox", icon: ClipboardCheck },
] as const;

export function AdminWorkspace({ children, organization, variant = "admin" }: {
    children: ReactNode;
    organization?: string;
    variant?: "admin" | "attestant";
}) {
    const { t } = useTranslation();
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const { data: approvals } = useApprovals();
    const pending = approvals?.length ?? 0;
    const overdue = countOverdue(approvals);
    const badgeLabel = overdue > 0
        ? t("sidebar.approvalsWithOverdue", { pending, overdue })
        : t("sidebar.approvalsPending", { pending });
    const sections = variant === "attestant" ? attestantSections : adminSections;

    return (
        <div className={styles.workspace}>
            <div className={styles.topline}>
                <span>{organization || t("sidebar.admin")}</span>
                <Link to="/logout" className={styles.logout}>
                    <LogOut size={16} aria-hidden="true" />
                    {t("sidebar.logout")}
                </Link>
            </div>

            <div className={styles.surface}>
                <nav
                    className={`${styles.navigation} ${variant === "attestant" ? styles.twoSections : ""}`}
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
                                    <span className={styles.count} aria-label={badgeLabel} title={badgeLabel}>
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
