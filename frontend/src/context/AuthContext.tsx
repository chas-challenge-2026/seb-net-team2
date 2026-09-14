import { createContext } from "react";
import type { AuthUser } from "../schemas/userSchema";

export interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    isLoggingIn: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => void;
}

export const AuthContext =
    createContext<AuthContextType | null>(null);