import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function Dashboard() {
    const navigate = useNavigate();
    const { user, token, logout, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !token) {
            navigate("/login");
        }
    }, [isLoading, token, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-zinc-500">Loading session...</p>
            </div>
        );
    }

    if (!token) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-zinc-200 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
                <p className="text-zinc-500">Welcome to your dashboard, {user?.name || 'User'}! You are successfully logged in.</p>

                <div className="p-4 bg-zinc-100 rounded-lg text-left break-all text-xs text-zinc-600 font-mono">
                    <span className="font-bold block mb-2 text-sm text-zinc-800">Your JWT Token:</span>
                    {token}
                </div>

                <Button onClick={logout} className="w-full" variant="destructive">
                    Logout
                </Button>
            </div>
        </div>
    );
}

export default Dashboard;
