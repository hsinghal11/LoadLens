import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import AppLayout from "../components/layout/AppLayout";

export function ProtectedRoute() {
  const checkLogin = useAuthStore((state) => state.checkLogin);
  const location = useLocation();

  if (!checkLogin()) {
    // Redirect them to the /landing or /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout />;
}
