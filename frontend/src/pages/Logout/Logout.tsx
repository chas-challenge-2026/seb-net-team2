import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "../../hooks/useAuth";
import LoadingWheel from "../../components/LoadingState/LoadingWheel";

export function Logout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        logout();

        void navigate({
            to: "/login",
            replace: true,
        });
    }, [logout, navigate]);

    return <LoadingWheel size="medium" />;
}