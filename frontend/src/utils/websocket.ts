export function getWebSocketUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      return `${url.origin}/ws`;
    } catch {
      return `${baseUrl.replace(/\/+$/, "")}/ws`;
    }
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/ws`;
  }

  return "/ws";
}
