import { useState } from "react"
import { AuthContext } from "./AuthContext"

// swap useState initial value for a real API call when backend is ready
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(true)

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            login: () => setIsAuthenticated(true),
            logout: () => setIsAuthenticated(false),
        }}>
            {children}
        </AuthContext.Provider>
    )
}
