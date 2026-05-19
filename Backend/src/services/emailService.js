export const buildClientUrl = (path, params = {}) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const url = new URL(path, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
};

export const sendAuthEmail = async ({ to, subject, actionUrl }) => {
  console.log(`[email placeholder] ${subject} -> ${to}: ${actionUrl}`);
  return { queued: true };
};
