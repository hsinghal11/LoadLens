import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

interface User {
    id?: string;
    name?: string;
    email?: string;
    [key: string]: any; // fallback for varying backend responses
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const queryClient = useQueryClient();

    // TanStack Query to fetch the session
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ["session"],
        queryFn: () => authApi.getCurrentUser(token!),
        enabled: !!token,
        retry: 1,
    });

    // If fetching the user fails (e.g., token expired), logout the user
    useEffect(() => {
        if (isError) {
            logout();
        }
    }, [isError]);

    const login = (newToken: string) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        queryClient.removeQueries({ queryKey: ["session"] });
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isLoading,
                token,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
