import { useTranslation } from 'react-i18next'

import { ReminderSettings } from '../../components/ReminderSettings/ReminderSettings'
import { useAuth } from '../../hooks/useAuth'

import styles from './Profil.module.css'

export function Profil() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const canApprove = user?.role === 'Attestant' || user?.role === 'Admin'

    return (
        <section className={styles.page} aria-labelledby="profile-title">
            <header className={styles.header}>
                <h1 id="profile-title">{t('profilePage.title')}</h1>
                <p className={styles.intro}>{t('profilePage.description')}</p>
            </header>

            {user && (
                <section className={styles.card} aria-labelledby="profile-details-title">
                    <h2 id="profile-details-title">{t('profilePage.details.title')}</h2>

                    <dl className={styles.details}>
                        <div>
                            <dt>{t('users.form.name')}</dt>
                            <dd>{user.name}</dd>
                        </div>

                        <div>
                            <dt>{t('users.form.email')}</dt>
                            <dd>{user.email}</dd>
                        </div>

                        <div>
                            <dt>{t('users.form.role')}</dt>
                            <dd>{t(`users.roles.${user.role}`)}</dd>
                        </div>

                        <div>
                            <dt>{t('profilePage.details.company')}</dt>
                            <dd>{user.tenantName}</dd>
                        </div>
                    </dl>
                </section>
            )}

            {canApprove && <ReminderSettings />}
        </section>
    )
}
