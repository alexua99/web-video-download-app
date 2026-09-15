export function getApiBase() {
  let base = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
  if (!base) return "";

  base = base.replace(/\/$/, "");
  if (/^https?:\/\//i.test(base)) return base;
  if (base.startsWith("/")) return "";

  return `https://${base}`;
}

export function apiUrl(path: string) {
  return `${getApiBase()}${path}`;
}

export function hasRemoteApi() {
  return Boolean(getApiBase());
}
