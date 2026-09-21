import React, {
  useEffect,
  useId,
  useState,
} from 'react';

import { Link } from '@tanstack/react-router';

import { useAuth } from '../hooks/useAuth';

import styles from './Sidebar.module.css';

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
  const [isOpen, setIsOpen] = useState(false);

  const sidebarId = useId();

  const { user } = useAuth();

  function toggleMobileSidebar() {
    setIsOpen((previous) => !previous);
  }

  function handleMobileNavClick() {
    setIsOpen(false);
  }

  useEffect(() => {
    function closeOnEscape(
      event: KeyboardEvent
    ) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener(
      'keydown',
      closeOnEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        closeOnEscape
      );
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles['hamburger-btn']}
        onClick={toggleMobileSidebar}
        aria-label="Menu"
        aria-controls={sidebarId}
        aria-expanded={isOpen}
      >
        ☰
      </button>

      {isOpen && (
        <div
          className={styles['sidebar-backdrop']}
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        id={sidebarId}
        className={`
          ${styles.sidebar}
          ${isOpen ? styles.open : ''}
          ${collapsed ? styles.collapsed : ''}
        `}
      >
        <button
          type="button"
          className={styles['collapse-toggle']}
          onClick={onToggleCollapsed}
          aria-label={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          aria-expanded={!collapsed}
          aria-controls={sidebarId}
        >
          <svg
            className={
              styles['collapse-toggle-icon']
            }
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

        <nav className={styles['sidebar-nav']}>
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className={styles['nav-item']}
            activeProps={{
              className: `${styles['nav-item']} ${styles.active}`,
            }}
            onClick={handleMobileNavClick}
          >
            <span>Dashboard</span>
          </Link>

          {(user?.role === 'Initiator' ||
            user?.role === 'Admin') && (
              <>
                <Link
                  to="/ny-betalning"
                  activeOptions={{ exact: true }}
                  className={styles['nav-item']}
                  activeProps={{
                    className: `${styles['nav-item']} ${styles.active}`,
                  }}
                  onClick={handleMobileNavClick}
                >
                  <span>New payment</span>
                </Link>

                <Link
                  to="/batch"
                  activeOptions={{ exact: true }}
                  className={styles['nav-item']}
                  activeProps={{
                    className: `${styles['nav-item']} ${styles.active}`,
                  }}
                  onClick={handleMobileNavClick}
                >
                  <span>Batch upload</span>
                </Link>
              </>
            )}

          {(user?.role === 'Attestant' ||
            user?.role === 'Admin') && (
              <Link
                to="/attestkorg"
                activeOptions={{ exact: true }}
                className={styles['nav-item']}
                activeProps={{
                  className: `${styles['nav-item']} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>Approval inbox</span>

                <span className={styles.badge}>
                  2
                </span>
              </Link>
            )}

          {user?.role === 'Admin' && (
            <>
              <Link
                to="/granskningslogg"
                activeOptions={{ exact: true }}
                className={styles['nav-item']}
                activeProps={{
                  className: `${styles['nav-item']} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>Audit log</span>
              </Link>

              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                className={styles['nav-item']}
                activeProps={{
                  className: `${styles['nav-item']} ${styles.active}`,
                }}
                onClick={handleMobileNavClick}
              >
                <span>Administration</span>
              </Link>
            </>
          )}

          <Link
            to="/profil"
            activeOptions={{ exact: true }}
            className={styles['nav-item']}
            activeProps={{
              className: `${styles['nav-item']} ${styles.active}`,
            }}
            onClick={handleMobileNavClick}
          >
            <span>My profile</span>
          </Link>
        </nav>

        <div className={styles['sidebar-footer']}>
          <div className={styles['user-info']}>
            {user?.name && (
              <span className={styles['user-name']}>
                {user.name}
              </span>
            )}

            {user?.email && (
              <span className={styles['user-email']}>
                {user.email}
              </span>
            )}

            <span className={styles['user-role']}>
              {user?.role}
            </span>
          </div>

          {onLogout ? (
            <button
              type="button"
              className={styles['logout-btn']}
              onClick={onLogout}
            >
              Log out
            </button>
          ) : (
            <Link
              to="/logout"
              className={styles['logout-link']}
              onClick={handleMobileNavClick}
            >
              Log out
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};