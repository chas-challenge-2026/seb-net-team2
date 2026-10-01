import {
    Outlet,
    useRouterState,
} from "@tanstack/react-router";

import { useState } from "react";

import { NavigationBar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { OverdueReminder } from "../components/OverdueReminder/OverdueReminder";

import { useAuth } from "../hooks/useAuth";

import styles from "../components/Sidebar.module.css";

export function MainLayout() {
    const { isAuthenticated } = useAuth();

    const pathname = useRouterState({
        select: (state) =>
            state.location.pathname,
    });

    const isAdminRoute =
        pathname.startsWith("/admin");

    const [collapsed, setCollapsed] =
        useState(false);

    function handleToggleCollapsed() {
        setCollapsed(
            (current) => !current
        );
    }

    const showSidebar =
        isAuthenticated && !isAdminRoute;

    return (
        <>
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <NavigationBar />

            {showSidebar && (
                <Sidebar
                    collapsed={collapsed}
                    onToggleCollapsed={
                        handleToggleCollapsed
                    }
                />
            )}

            <main
                id="main-content"
                tabIndex={-1}
                aria-label="Main content"
                className={
                    showSidebar
                        ? `${styles.content} ${collapsed
                            ? styles.contentCollapsed
                            : ""
                        }`
                        : ""
                }
            >
                <Outlet />
            </main>

            {isAuthenticated && <OverdueReminder />}
        </>
    );
}