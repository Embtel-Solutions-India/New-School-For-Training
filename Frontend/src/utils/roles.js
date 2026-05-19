export const normalizeRole = (role) => {
  if (role === "user") return "student";
  if (role === "instructor") return "teacher";
  return ["student", "teacher", "admin"].includes(role) ? role : "student";
};

export const formatRole = (role) => normalizeRole(role).replace("_", " ");
