import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import useAuthStore from "../store/authStore";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    API.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setSession(data.user, token);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, params, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-green-700 font-semibold">
      Signing you in...
    </div>
  );
};

export default AuthCallback;
