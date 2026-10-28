import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RouteAccessibility } from "../components/RouteAccessibility";

import { NavigationBar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { OverdueReminder } from "../components/OverdueReminder/OverdueReminder";
import { Footer } from "../components/Footer/Footer";

import { useAuth } from "../hooks/useAuth";

import layout from "./MainLayout.module.css";
import { AdminWorkspace } from "./AdminWorkspace";

export function MainLayout() {
    const { t } = useTranslation();
    const { isAuthenticated, user } = useAuth();
    const isAdmin = isAuthenticated && user?.role === "Admin";
    const isAttestant = isAuthenticated && user?.role === "Attestant";
    const isInitiator = isAuthenticated && user?.role === "Initiator";
    const usesWorkspace = isAdmin || isAttestant || isInitiator;
    const [collapsed, setCollapsed] = useState(false);

    function handleToggleCollapsed() {
        setCollapsed((current) => !current);
    }

    return (
        <>
            <RouteAccessibility />
            <a className="skip-link" href="#main-content">
                {t("a11y.skip")}
            </a>

            <NavigationBar />

            <div className={layout.page}>
                <div className={`${layout.body} ${isAuthenticated && !usesWorkspace ? layout.authenticated : ""} ${collapsed ? layout.collapsed : ""}`}>
                    {isAuthenticated && !usesWorkspace && (
                        <div className={layout.sidebarRail}>
                            <Sidebar
                                collapsed={collapsed}
                                onToggleCollapsed={handleToggleCollapsed}
                            />
                        </div>
                    )}
                <main
                    id="main-content"
                    tabIndex={-1}
                    aria-label={t("a11y.main")}
                    className={layout.main}
                >
                    {usesWorkspace ? (
                        <AdminWorkspace
                            organization={user?.tenantName}
                            user={user ?? undefined}
                            variant={isAdmin ? "admin" : isAttestant ? "attestant" : "initiator"}
                        >
                            <Outlet />
                        </AdminWorkspace>
                    ) : (
                        <Outlet />
                    )}
                </main>
                </div>
                <Footer />
            </div>

            {isAuthenticated && <OverdueReminder />}
        </>
    );
}
