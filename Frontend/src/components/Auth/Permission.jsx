import useAuthStore from "../../store/authStore";
import { normalizeRole } from "../../utils/roles";

const Permission = ({ roles = [], children, fallback = null }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(normalizeRole(user.role))) {
    return fallback;
  }

  return children;
};

export default Permission;
