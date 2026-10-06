import { Navigate } from "@tanstack/react-router";

import { useAuth } from "../hooks/useAuth";
import LoadingWheel from "./LoadingState/LoadingWheel";

export function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        isAuthenticated,
        isInitializing,
    } = useAuth();

    if (isInitializing) {
        return <LoadingWheel size="medium" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
}