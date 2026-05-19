export const ROLES = Object.freeze({
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin",
});

export const roleValues = Object.values(ROLES);

export const normalizeRole = (role) => {
  if (role === "user") return ROLES.STUDENT;
  if (role === "instructor") return ROLES.TEACHER;
  return roleValues.includes(role) ? role : ROLES.STUDENT;
};

export const isRoleAllowed = (role, allowedRoles = []) =>
  allowedRoles.includes(normalizeRole(role));
