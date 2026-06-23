export function getApiUrl(path = ""): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, "");
    return `${trimmed}${path.startsWith("/") ? "" : "/"}${path.replace(/^\/+/, "")}`;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/+$/, "");
    return `${origin}/api${path.startsWith("/") ? "" : "/"}${path.replace(/^\/+/, "")}`;
  }

  return `/api${path.startsWith("/") ? "" : "/"}${path.replace(/^\/+/, "")}`;
}

export function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined") return `${window.location.origin.replace(/\/+$/, "")}/api`;
  return "/api";
}
