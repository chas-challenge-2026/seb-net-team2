import React, { useEffect, useId, useState } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Sidebar.module.css';


export interface SidebarProps {
  userRole?: 'initiator' | 'attestant' | 'admin';
  userName?: string;
  onLogout?: () => void;
}


export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'attestant',
  userName = 'Johan Berg',
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarId = useId();
  const roleLabels = {
    initiator: 'Initiator',
    attestant: 'Approver',
    admin: 'Administrator',
  };
  const roleLabel = roleLabels[userRole];


  const toggleSidebar = () => setIsOpen(!isOpen);


  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);


  const handleNavClick = () => {
    setIsOpen(false); // Stäng sidebaren på mobil när man klickat
  };


  return (
    <>
      {/* Hamburgarknapp för mobiler */}
      <button
        className={styles['hamburger-btn']}
        onClick={toggleSidebar}
        aria-label="Menu"
        aria-controls={sidebarId}
        aria-expanded={isOpen}
      >
        ☰
      </button>


      {/* Skuggbakgrund på mobil när sidebaren är öppen */}
      {isOpen && <div className={styles['sidebar-backdrop']} onClick={toggleSidebar} />}


      <aside id={sidebarId} className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* SEB Bank Logga & Rubrik */}
        <div className={styles['sidebar-header']}>
          <h2 className={styles['sidebar-title']}>Business</h2>
        </div>


        {/* Navigationslänkar */}
        <nav className={styles['sidebar-nav']}>
          <div className={styles['nav-group']}>
            <Link
              to="/"
              className={styles['nav-item']}
              activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
              onClick={handleNavClick}
            >
              <span>Dashboard</span>
            </Link>
          </div>

          {(userRole === 'initiator' || userRole === 'admin') && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Payments</p>
              <Link
                to="/ny-betalning"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>New payment</span>
              </Link>
              <Link
                to="/batch"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Batch upload</span>
              </Link>
            </div>
          )}

          {/* Only shown for approvers and administrators */}
          {(userRole === 'attestant' || userRole === 'admin') && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Approvals</p>
              <Link
                to="/attestkorg"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Approval inbox</span>
                <span className={styles.badge}>2</span>
              </Link>
            </div>
          )}

          {/* Only shown for administrators */}
          {userRole === 'admin' && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Administration</p>
              <Link
                to="/granskningslogg"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Audit log</span>
              </Link>
            </div>
          )}

          <div className={`${styles['nav-group']} ${styles['nav-group-last']}`}>
          
            <Link
              to="/profil"
              className={styles['nav-item']}
              activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
              onClick={handleNavClick}
            >
              <span>My profile</span>
            </Link>
          </div>
        </nav>


        {/* User profile and logout */}
        <div className={styles['sidebar-footer']}>
          <div className={styles['user-info']}>
            <span className={styles['user-name']}>{userName}</span>
            <span className={styles['user-role']}>{roleLabel}</span>
          </div>
          {onLogout && (
            <button className={styles['logout-btn']} onClick={onLogout}>
              Log out
            </button>
          )}
          {!onLogout && (
            <Link to="/logga-ut" className={styles['logout-link']} onClick={handleNavClick}>
              Log out
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};
