import { Link } from '@tanstack/react-router'
import { navigationLinks } from '../constants/routes'
import { NotificationBell } from './Notifications/NotificationBell'
import styles from './Navbar.module.css'

export function NavigationBar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar__brand}>
                <Link to="/dashboard" className={styles.navbar__brandLink} aria-label="Go to dashboard">
                    <img
                        src="/seb-logo.svg"
                        alt="SEB"
                        className={styles.navbar__logo}
                    />
                </Link>
            </div>
            <ul className={styles.navbar__links}>
                {navigationLinks.map(({ to, label }) => (
                    <li key={to}>
                        <Link
                            to={to}
                            className={styles.navbar__link}
                            activeProps={{ className: `${styles.navbar__link} ${styles['navbar__link--active']}` }}
                        >
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
            <div className={styles.navbar__user}>
                <NotificationBell />
            </div>
        </nav>
    )
}
