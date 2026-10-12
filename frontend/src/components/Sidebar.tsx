import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FileUp,
  House,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useApprovals } from "../hooks/useApprovals";
import { countOverdue } from "../utils/approvalReminders";

import styles from "./Sidebar.module.css";

export interface SidebarProps {
  onLogout?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  collapsed,
  onToggleCollapsed,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [badgePulsing, setBadgePulsing] = useState(false);

  const sidebarId = useId();

  const isAdmin = user?.role === "Admin";
  const isInitiator = user?.role === "Initiator";
  const isAttestant = user?.role === "Attestant";

  const canViewApprovals = isAttestant || isAdmin;
  const canViewSavings = user?.role === "User" || isInitiator;

  const { data: approvals } = useApprovals(canViewApprovals);

  const pendingApprovalCount = approvals?.length ?? 0;
  const overdueApprovalCount = countOverdue(approvals);

  const badgeLabel =
    overdueApprovalCount > 0
      ? t("sidebar.approvalsWithOverdue", {
        pending: pendingApprovalCount,
        overdue: overdueApprovalCount,
      })
      : t("sidebar.approvalsPending", {
        pending: pendingApprovalCount,
      });

  const previousPendingCount = useRef(pendingApprovalCount);

  useEffect(() => {
    if (pendingApprovalCount > previousPendingCount.current) {
      setBadgePulsing(true);

      const timeout = setTimeout(() => {
        setBadgePulsing(false);
      }, 300);

      previousPendingCount.current = pendingApprovalCount;

      return () => clearTimeout(timeout);
    }

    previousPendingCount.current = pendingApprovalCount;
  }, [pendingApprovalCount]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function toggleMobileSidebar() {
    setIsOpen((previous) => !previous);
  }

  function handleMobileNavClick() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={styles["hamburger-btn"]}
        onClick={toggleMobileSidebar}
        aria-label={t("sidebar.menu")}
        aria-controls={sidebarId}
        aria-expanded={isOpen}
      >
        <Menu size={22} strokeWidth={2} aria-hidden="true" />
      </button>

      {isOpen && (
        <button
          type="button"
          className={styles["sidebar-backdrop"]}
          aria-label={t("sidebar.closeMenu")}
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        id={sidebarId}
        aria-label={t("sidebar.secondaryNavigation")}
        className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${collapsed ? styles.collapsed : ""}`}
      >
        <button
          type="button"
          className={styles["collapse-toggle"]}
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          aria-expanded={!collapsed}
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        <nav aria-label={t("sidebar.navigationLinks")} className={styles["sidebar-nav"]}>
          {!isAdmin && (
            <Link
              to="/dashboard"
              activeOptions={{ exact: true }}
              className={styles["nav-item"]}
              activeProps={{
                className: `${styles["nav-item"]} ${styles.active}`,
              }}
              onClick={handleMobileNavClick}
              title={collapsed ? t("sidebar.dashboard") : undefined}
            >
              <House size={20} strokeWidth={2} aria-hidden="true" />

              <span className={styles["nav-item-label"]}>
                {t("sidebar.dashboard")}
              </span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              className={styles["nav-item"]}
              activeProps={{
                className: `${styles["nav-item"]} ${styles.active}`,
              }}
              onClick={handleMobileNavClick}
              title={collapsed ? t("admin.navigation.overview") : undefined}
            >
              <LayoutDashboard size={20} strokeWidth={2} aria-hidden="true" />

              <span className={styles["nav-item-label"]}>
                {t("admin.navigation.overview")}
              </span>
            </Link>
          )}

          {isInitiator && (
            <div className={styles["nav-section"]}>
              <span className={styles["section-label"]}>
                {t("sidebar.payments")}
              </span>

              <Link
                to="/ny-betalning"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("sidebar.newPayment") : undefined}
              >
                <CreditCard size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("sidebar.newPayment")}
                </span>
              </Link>

              <Link
                to="/batch"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("sidebar.batchUpload") : undefined}
              >
                <FileUp size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("sidebar.batchUpload")}
                </span>
              </Link>
            </div>
          )}

          {canViewSavings && (
            <div className={styles["nav-section"]}>
              <span className={styles["section-label"]}>
                {t("sidebar.savings")}
              </span>

              <Link
                to="/spara-investera"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("navigation.saveInvest") : undefined}
              >
                <Landmark size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("navigation.saveInvest")}
                </span>
              </Link>
            </div>
          )}

          {canViewApprovals && (
            <div className={styles["nav-section"]}>
              <span className={styles["section-label"]}>
                {t("sidebar.approvals")}
              </span>

              <Link
                to="/attestkorg"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? badgeLabel : undefined}
              >
                <ClipboardCheck size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("sidebar.approvalInbox")}
                </span>

                {pendingApprovalCount > 0 && (
                  <span
                    className={`${styles.badge} ${badgePulsing ? styles.pulse : ""} ${overdueApprovalCount > 0 ? styles.overdue : ""}`}
                    title={badgeLabel}
                    aria-label={badgeLabel}
                  >
                    {pendingApprovalCount}
                  </span>
                )}
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className={styles["nav-section"]}>
              <span className={styles["section-label"]}>
                {t("sidebar.admin")}
              </span>

              <Link
                to="/admin/users"
                activeOptions={{ exact: false }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("admin.navigation.users") : undefined}
              >
                <Users size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("admin.navigation.users")}
                </span>
              </Link>

              <Link
                to="/admin/approval-limits"
                activeOptions={{ exact: false }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("admin.navigation.approvalLimits") : undefined}
              >
                <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("admin.navigation.approvalLimits")}
                </span>
              </Link>

              <Link
                to="/granskningslogg"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
                title={collapsed ? t("sidebar.auditLog") : undefined}
              >
                <ScrollText size={20} strokeWidth={2} aria-hidden="true" />

                <span className={styles["nav-item-label"]}>
                  {t("sidebar.auditLog")}
                </span>
              </Link>
            </div>
          )}
        </nav>

        <div className={styles["sidebar-footer"]}>
          {onLogout ? (
            <button
              type="button"
              className={styles["logout-btn"]}
              onClick={onLogout}
              title={collapsed ? t("sidebar.logout") : undefined}
              aria-label={t("sidebar.logout")}
            >
              <LogOut size={20} strokeWidth={2} aria-hidden="true" />

              <span className={styles["nav-item-label"]}>
                {t("sidebar.logout")}
              </span>
            </button>
          ) : (
            <Link
              to="/logout"
              className={styles["logout-link"]}
              onClick={handleMobileNavClick}
              title={collapsed ? t("sidebar.logout") : undefined}
            >
              <LogOut size={20} strokeWidth={2} aria-hidden="true" />

              <span className={styles["nav-item-label"]}>
                {t("sidebar.logout")}
              </span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};