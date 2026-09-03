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
        aria-label="Meny"
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
          <h2 className={styles['sidebar-title']}>Företag</h2>
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
              <span>Översikt</span>
            </Link>
          </div>

          {(userRole === 'initiator' || userRole === 'admin') && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Betalningar</p>
              <Link
                to="/ny-betalning"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Ny betalning</span>
              </Link>
              <Link
                to="/batch"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Betalningar i batch</span>
              </Link>
            </div>
          )}

          {/* Visas ENDAST för Attestanter och Admins */}
          {(userRole === 'attestant' || userRole === 'admin') && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Attestering</p>
              <Link
                to="/attestkorg"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Attestkorg</span>
                <span className={styles.badge}>2</span>
              </Link>
            </div>
          )}

          {/* Visas ENDAST för Admin */}
          {userRole === 'admin' && (
            <div className={styles['nav-group']}>
              <p className={styles['nav-section-title']}>Administration</p>
              <Link
                to="/granskningslogg"
                className={styles['nav-item']}
                activeProps={{ className: `${styles['nav-item']} ${styles.active}` }}
                onClick={handleNavClick}
              >
                <span>Granskningslogg</span>
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
              <span>Min profil</span>
            </Link>
          </div>
        </nav>


        {/* Användarprofil & Logga ut längst ned */}
        <div className={styles['sidebar-footer']}>
          <div className={styles['user-info']}>
            <span className={styles['user-name']}>{userName}</span>
            <span className={styles['user-role']}>{userRole.toUpperCase()}</span>
          </div>
          {onLogout && (
            <button className={styles['logout-btn']} onClick={onLogout}>
              Logga ut
            </button>
          )}
          {!onLogout && (
            <Link to="/logga-ut" className={styles['logout-link']} onClick={handleNavClick}>
              Logga ut
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};
