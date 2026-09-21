import {
    Link,
    Outlet,
} from "@tanstack/react-router";

import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <h2>Administration</h2>

                <nav className={styles.navigation}>
                    <Link
                        to="/admin"
                        activeOptions={{ exact: true }}
                    >
                        Overview
                    </Link>

                    <Link
                        to="/admin/users"
                        activeOptions={{ exact: true }}
                    >
                        Users
                    </Link>

                    <Link
                        to="/admin/users/create"
                        activeOptions={{ exact: true }}
                    >
                        Create user
                    </Link>
                </nav>
            </aside>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}