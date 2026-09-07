import { Link } from '@tanstack/react-router'
import { navigationLinks } from '../constants/routes'
import styles from './Navbar.module.css'

export function NavigationBar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar__brand}>
                <span> SEB </span>
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
            </div>
        </nav>
    )
}
