const isProduction = process.env.NODE_ENV === "production";
const cookieSecure =
  process.env.COOKIE_SECURE === "true" || (isProduction && process.env.COOKIE_SECURE !== "false");
const cookieSameSite = cookieSecure ? "none" : "lax";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

export const refreshCookieName = "sft_refresh_token";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};
