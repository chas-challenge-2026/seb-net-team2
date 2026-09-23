import {
    Link,
    Outlet,
} from "@tanstack/react-router";

import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <h2 className={styles.heading}>
                    Administration
                </h2>

                <nav className={styles.navigation}>
                    <Link
                        to="/admin"
                        activeOptions={{ exact: true }}
                    >
                        Overview
                    </Link>

                    <div className={styles.section}>
                        <h3 className={styles.sectionHeading}>
                            Users
                        </h3>

                        <div className={styles.sectionLinks}>
                            <Link
                                to="/admin/users"
                                activeOptions={{ exact: true }}
                            >
                                All users
                            </Link>

                            <Link
                                to="/admin/users/create"
                                activeOptions={{ exact: true }}
                            >
                                Create user
                            </Link>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionHeading}>
                            Approval limits
                        </h3>

                        <div className={styles.sectionLinks}>
                            <Link
                                to="/admin/approval-limits"
                                activeOptions={{ exact: true }}
                            >
                                All approval limits
                            </Link>

                            <Link
                                to="/admin/approval-limits/create"
                                activeOptions={{ exact: true }}
                            >
                                Create approval limit
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