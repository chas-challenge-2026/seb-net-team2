import {
    useCallback,
    useEffect,
    useState,
} from "react";

import type { ReactNode } from "react";

import { AuthContext } from "./AuthContext";

import {
    getCurrentUser,
    loginUser,
} from "../services/authService";

import {
    getAuthToken,
    setAuthToken,
    removeAuthToken,
} from "../utils/authStorage";

import { SESSION_EXPIRED_EVENT } from "../utils/authEvents";

import type { AuthUser } from "../schemas/userSchema";

type AuthProviderProps = {
    children: ReactNode;
};

const useMockAuth =
    import.meta.env.VITE_MOCK_AUTH === "false";

const mockUser: AuthUser = {
    userId: 1,
    role: "Admin",
    tenantId: 1,
};

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] =
        useState<AuthUser | null>(
            useMockAuth ? mockUser : null
        );

    const [token, setToken] =
        useState<string | null>(null);

    const [isInitializing, setIsInitializing] =
        useState(!useMockAuth);

    const [isLoggingIn, setIsLoggingIn] =
        useState(false);

    const [sessionExpired, setSessionExpired] =
        useState(false);

    const isAuthenticated = useMockAuth
        ? user !== null
        : user !== null && token !== null;



    useEffect(() => {
        if (useMockAuth) {
            return;
        }

        const storedToken = getAuthToken();

        if (!storedToken) {
            setIsInitializing(false);
            return;
        }


        async function restoreAuth(
            savedToken: string
        ) {
            try {
                const currentUser =
                    await getCurrentUser();

                setToken(savedToken);
                setUser(currentUser);
            } catch {
                removeAuthToken();

                setToken(null);
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        }

        void restoreAuth(storedToken);
    }, []);

    useEffect(() => {
        function handleSessionExpired() {
            setToken(null);
            setUser(null);
            setSessionExpired(true);
        }

        window.addEventListener(
            SESSION_EXPIRED_EVENT,
            handleSessionExpired
        );

        return () => {
            window.removeEventListener(
                SESSION_EXPIRED_EVENT,
                handleSessionExpired
            );
        };
    }, []);

    async function login(
        email: string,
        password: string
    ) {
        if (useMockAuth) {
            setUser(mockUser);
            return;
        }

        setIsLoggingIn(true);

        try {
            const response = await loginUser(
                email,
                password
            );

            setAuthToken(response.token);

            setToken(response.token);

            setUser({
                userId: response.userId,
                email: response.email,
                role: response.role,
                tenantId: response.tenantId,
            });
        } finally {
            setIsLoggingIn(false);
        }
    }

    const logout = useCallback(() => {
        if (useMockAuth) {
            setUser(null);
            return;
        }

        removeAuthToken();

        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isInitializing,
                isLoggingIn,
                sessionExpired,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}