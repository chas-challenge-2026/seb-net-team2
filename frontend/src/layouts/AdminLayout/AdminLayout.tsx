import { Outlet } from "@tanstack/react-router";

import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    return (
        <div className={styles.content}>
            <Outlet />
        </div>
    );
}