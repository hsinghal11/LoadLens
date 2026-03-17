import useAuthStore from "@/store/useAuthStore";
import {authApi} from "@/api/auth";
import {useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

function OAuthSuccess() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const {login, logout} = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleOAuthSuccess() {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const token = searchParams.get("token");
        if (!token) {
          alert("No token provided!");
          navigate("/login");
          return;
        }

        logout();
        
        const user = await authApi.getCurrentUser(token);
        
        login(user.token, user.user);


        alert("Login success!");
        navigate("/dashboard");

      } catch (error) {
        alert("Error while login!");
        console.log(error);
        navigate("/login");
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    handleOAuthSuccess();
  }, [searchParams, login, navigate, isLoading, logout]);

  return (
    <div className="p-10 flex flex-col gap-3 justify-center items-center">
      <h1 className="text-2xl font-semibold">Please wait....</h1>
    </div>
  );
}

export default OAuthSuccess;
