import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { NavigationBar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { OverdueReminder } from "../components/OverdueReminder/OverdueReminder";

import { useAuth } from "../hooks/useAuth";

import styles from "../components/Sidebar.module.css";

export function MainLayout() {
    const { isAuthenticated } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    function handleToggleCollapsed() {
        setCollapsed((current) => !current);
    }

    return (
        <>
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <NavigationBar />

            {isAuthenticated && (
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapsed={handleToggleCollapsed}
                />
            )}

            <main
                id="main-content"
                tabIndex={-1}
                aria-label="Main content"
                className={
                    isAuthenticated
                        ? `${styles.content} ${collapsed ? styles.contentCollapsed : ""}`
                        : ""
                }
            >
                <Outlet />
            </main>

            {isAuthenticated && <OverdueReminder />}
        </>
    );
}