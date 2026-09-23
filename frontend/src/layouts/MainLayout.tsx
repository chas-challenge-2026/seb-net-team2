import {
    Outlet,
    useRouterState,
} from "@tanstack/react-router";

import { useState } from "react";

import { NavigationBar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

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
        </>
    );
}