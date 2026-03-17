/* OAuthCallbackPage: reads ?token= from URL, saves to Zustand, navigates to /home */
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useAuthStore from "@/store/useAuthStore";
import api from "@/api/axios";
import { LoadingState } from "@/components/ui/LoadingState";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("OAuth authentication failed – no token received.");
      navigate("/login");
      return;
    }

    // Fetch the user profile using the token
    api
      .get("/api/v1/user/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        login(token, res.data);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        toast.error("Failed to fetch user profile after OAuth login.");
        navigate("/login");
      });
  }, []); // run once on mount

  return <LoadingState message="Completing authentication…" />;
}
