import { Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    const { t } = useTranslation();

    return (
        <div className={styles.content}>
            <nav
                className={styles.tabs}
                aria-label={t("sidebar.admin")}>
                <Link
                    to="/admin/users"
                    className={styles.tab}
                    activeOptions={{ exact: false }}
                    activeProps={{ className: styles.activeTab }}
                >{t("admin.navigation.users")}</Link>
                <Link
                    to="/admin/approval-limits"
                    className={styles.tab}
                    activeOptions={{ exact: false }}
                    activeProps={{ className: styles.activeTab }}
                >{t("admin.navigation.approvalLimits")}</Link>
            </nav>
            <Outlet />
        </div>
    );
}
