import { ReminderSettings } from '../../components/ReminderSettings/ReminderSettings'
import { useAuth } from '../../hooks/useAuth'

export function Profil() {
    const { user } = useAuth()
    const canApprove = user?.role === 'Attestant' || user?.role === 'Admin'

    return (
        <>
            <h1>Inloggad</h1>
            {canApprove && <ReminderSettings />}
        </>
    )
}
