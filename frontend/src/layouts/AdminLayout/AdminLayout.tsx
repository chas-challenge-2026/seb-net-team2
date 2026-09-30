import {
    Link,
    Outlet,
} from "@tanstack/react-router";

import { useTranslation } from "react-i18next";

import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    const { t } = useTranslation();

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <h2 className={styles.heading}>
                    {t("admin.navigation.title")}
                </h2>

                <nav className={styles.navigation}>
                    <Link
                        to="/admin"
                        activeOptions={{ exact: true }}
                    >
                        {t("admin.navigation.overview")}
                    </Link>

                    <div className={styles.section}>
                        <h3 className={styles.sectionHeading}>
                            {t("admin.navigation.users")}
                        </h3>

                        <div className={styles.sectionLinks}>
                            <Link
                                to="/admin/users"
                                activeOptions={{ exact: true }}
                            >
                                {t("admin.navigation.allUsers")}
                            </Link>

                            <Link
                                to="/admin/users/create"
                                activeOptions={{ exact: true }}
                            >
                                {t("admin.navigation.createUser")}
                            </Link>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionHeading}>
                            {t("admin.navigation.approvalLimits")}
                        </h3>

                        <div className={styles.sectionLinks}>
                            <Link
                                to="/admin/approval-limits"
                                activeOptions={{ exact: true }}
                            >
                                {t("admin.navigation.allApprovalLimits")}
                            </Link>

                            <Link
                                to="/admin/approval-limits/create"
                                activeOptions={{ exact: true }}
                            >
                                {t("admin.navigation.createApprovalLimit")}
                            </Link>
                        </div>
                    </div>
                </nav>
            </aside>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}