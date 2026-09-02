import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: {children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()
    if(!isAuthenticated) return <Navigate to="/logga-in" />
    return <>{children}</>
}