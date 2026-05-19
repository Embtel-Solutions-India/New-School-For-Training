import ApiError from "../utils/ApiError.js";
import { isRoleAllowed, ROLES } from "../utils/roles.js";

/**
 * Role-Based Access Control Middleware (allowRoles)
 * Restricts access to specified roles
 * - Verifies user is authenticated
 * - Checks if user role matches one of the allowed roles
 * - Returns 403 Forbidden if user role not in allowedRoles
 */
export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!isRoleAllowed(req.user.role, roles)) {
    console.warn("[rbac] Unauthorized role access attempt:", {
      userId: req.user._id,
      userRole: req.user.role,
      allowedRoles: roles,
      endpoint: req.originalUrl,
    });
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

/**
 * Self or Role-Based Middleware (allowSelfOrRoles)
 * Allows access if user has specified role OR is accessing their own resource
 * - Checks if user role matches allowedRoles OR
 * - Checks if req.params.id matches user's own ID
 * - Useful for user profile endpoints (can view self even without admin role)
 */
export const allowSelfOrRoles = (...roles) => (req, _res, next) => {
  if (isRoleAllowed(req.user?.role, roles) || req.params.id === req.user?._id.toString()) {
    return next();
  }

  console.warn("[rbac] Unauthorized self or role access attempt:", {
    userId: req.user?._id,
    userRole: req.user?.role,
    allowedRoles: roles,
    targetId: req.params.id,
    endpoint: req.originalUrl,
  });
  return next(new ApiError(403, "You do not have permission to access this resource"));
};

/**
 * Admin-Only Middleware (requireAdmin)
 * Strict enforcement of admin-only endpoints
 * - Verifies user is authenticated
 * - Checks user role is specifically "admin" (not just included in roles array)
 * - Logs all admin access attempts (both granted and denied) for audit trail
 */
export const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role !== ROLES.ADMIN) {
    console.warn("[admin-auth] Unauthorized admin access attempt:", {
      userId: req.user._id,
      userRole: req.user.role,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    return next(new ApiError(403, "Admin access required"));
  }

  console.info("[admin-auth] Admin access granted:", {
    userId: req.user._id,
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  return next();
};
