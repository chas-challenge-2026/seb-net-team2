import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

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

  const canViewApprovals =
    user?.role === "Attestant" ||
    user?.role === "Admin";

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
        ☰
      </button>

      {isOpen && (
        <button
          type="button"
          className={styles["sidebar-backdrop"]}
          aria-label="Close menu"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        id={sidebarId}
        aria-label="Secondary navigation"
        className={`
          ${styles.sidebar}
          ${isOpen ? styles.open : ""}
          ${collapsed ? styles.collapsed : ""}
        `}
      >
        <button
          type="button"
          className={styles["collapse-toggle"]}
          onClick={onToggleCollapsed}
          aria-label={
            collapsed
              ? t("sidebar.expand")
              : t("sidebar.collapse")
          }
          aria-expanded={!collapsed}
          aria-controls={sidebarId}
        >
          <svg
            className={styles["collapse-toggle-icon"]}
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M10 2 L5 8 L10 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <nav
          aria-label="Secondary navigation links"
          className={styles["sidebar-nav"]}
        >
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className={styles["nav-item"]}
            activeProps={{
              className: `${styles["nav-item"]} ${styles.active}`,
            }}
            onClick={handleMobileNavClick}
          >
            <span>{t("sidebar.dashboard")}</span>
          </Link>

          {user?.role === "Initiator" && (
            <>
              <Link
                to="/ny-betalning"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>{t("sidebar.newPayment")}</span>
              </Link>

              <Link
                to="/batch"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>{t("sidebar.batchUpload")}</span>
              </Link>
            </>
          )}

          {canViewApprovals && (
            <Link
              to="/attestkorg"
              activeOptions={{ exact: true }}
              className={styles["nav-item"]}
              activeProps={{
                className: `${styles["nav-item"]} ${styles.active}`,
              }}
              onClick={handleMobileNavClick}
            >
              <span>{t("sidebar.approvalInbox")}</span>

              {pendingApprovalCount > 0 && (
                <span
                  className={`${styles.badge} ${badgePulsing ? styles.pulse : ""
                    } ${overdueApprovalCount > 0 ? styles.overdue : ""
                    }`}
                  title={badgeLabel}
                  aria-label={badgeLabel}
                >
                  {pendingApprovalCount}
                </span>
              )}
            </Link>
          )}

          {user?.role === "Admin" && (
            <div className={styles["admin-section"]}>
              <span className={styles["section-label"]}>
                {t("sidebar.admin")}
              </span>

              <Link
                to="/granskningslogg"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>{t("sidebar.auditLog")}</span>
              </Link>

              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                className={styles["nav-item"]}
                activeProps={{
                  className: `${styles["nav-item"]} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>{t("sidebar.administration")}</span>
              </Link>
            </div>
          )}

          <Link
            to="/profil"
            activeOptions={{ exact: true }}
            className={styles["nav-item"]}
            activeProps={{
              className: `${styles["nav-item"]} ${styles.active}`,
            }}
            onClick={handleMobileNavClick}
          >
            <span>{t("sidebar.myProfile")}</span>
          </Link>
        </nav>

        <div className={styles["sidebar-footer"]}>
          <div className={styles["user-info"]}>
            {user?.name && (
              <span className={styles["user-name"]}>
                {user.name}
              </span>
            )}

            {user?.email && (
              <span className={styles["user-email"]}>
                {user.email}
              </span>
            )}

            <span className={styles["user-role"]}>
              {user?.role}
            </span>
          </div>

          {onLogout ? (
            <button
              type="button"
              className={styles["logout-btn"]}
              onClick={onLogout}
            >
              {t("sidebar.logout")}
            </button>
          ) : (
            <Link
              to="/logout"
              className={styles["logout-link"]}
              onClick={handleMobileNavClick}
            >
              {t("sidebar.logout")}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};