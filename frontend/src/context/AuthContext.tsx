import { createContext } from "react";

export interface AuthContextType {
    isAuthenticated: boolean
    login: () => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)