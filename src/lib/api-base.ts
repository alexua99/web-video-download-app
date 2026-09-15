export function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  return `${getApiBase()}${path}`;
}

export function hasRemoteApi() {
  return Boolean(getApiBase());
}
