import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { normalizeRole } from "../../utils/roles";

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const { user, accessToken, authLoading, hydrated, sessionChecked } = useAuthStore();

  if (!hydrated || authLoading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-green-700 font-semibold">
        Loading...
      </div>
    );
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(normalizeRole(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
