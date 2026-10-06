import { Navigate } from "@tanstack/react-router";

import { useAuth } from "../../hooks/useAuth";

import LoadingWheel from "../LoadingState/LoadingWheel";

import type { UserRole } from '../../schemas/userSchema';

type RoleProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles: UserRole[];
};

export function RoleProtectedRoute({
    children,
    allowedRoles,
}: RoleProtectedRouteProps) {
    const {
        user,
        isAuthenticated,
        isInitializing,
    } = useAuth();

    if (isInitializing) {
        return <LoadingWheel size="medium" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (
        !user ||
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/dashboard" />;
    }

    return <>{children}</>;
}