export const isSessionAllowed = (user) =>
  !!user && !["suspended", "disabled"].includes(user.accountStatus);

export const sessionStatusReason = (user) => {
  if (!user) return "User not found";
  if (user.accountStatus === "suspended") return "Account is suspended";
  if (user.accountStatus === "disabled") return "Account is disabled";
  return null;
};
