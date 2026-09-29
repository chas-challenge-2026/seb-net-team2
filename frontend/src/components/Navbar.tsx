import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { navigationLinks } from '../constants/routes'
import { NotificationBell } from './Notifications/NotificationBell'
import styles from './Navbar.module.css'
import LanguageSelector from './LanguageSelector/LanguageSelector'

export function NavigationBar() {
    const { t } = useTranslation()

    return (
        <nav className={styles.navbar} aria-label="Primary navigation">
            <div className={styles.navbar__brand}>
                <Link
                    to="/dashboard"
                    className={styles.navbar__brandLink}
                    aria-label={t('navigation.goToDashboard')}
                >
                    <img
                        src="/seb-logo.svg"
                        alt="SEB"
                        className={styles.navbar__logo}
                    />
                </Link>
            </div>

            <ul className={styles.navbar__links}>
                {navigationLinks.map(({ to, labelKey }) => (
                    <li key={to}>
                        <Link
                            to={to}
                            className={styles.navbar__link}
                            activeProps={{
                                className: `${styles.navbar__link} ${styles['navbar__link--active']}`
                            }}
                        >
                            {t(labelKey)}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className={styles.navbar__actions}>
                <LanguageSelector />
                <NotificationBell />
            </div>
        </nav>
    )
}