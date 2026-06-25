/**
 * Single source of truth for backend URLs.
 *
 * Historically the app read TWO different env vars inconsistently:
 *   - VITE_API_URL       (expected the full ".../api" URL)  -> api.ts, Analytics
 *   - VITE_API_BASE_URL  (expected the bare origin)         -> apiService, websockets
 * If only one was set in production (or one had a trailing slash), half the app
 * silently fell back to http://localhost:8080 and broke. This module accepts
 * EITHER var, normalizes it, and derives every URL the app needs from one origin.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const RAW_API = import.meta.env.VITE_API_URL as string | undefined;

/** Strip trailing slashes (prevents `origin//ws` and `origin//api`). */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Resolve the bare backend ORIGIN (scheme + host[:port]), no path, no trailing slash. */
function resolveOrigin(): string {
  // Prefer the explicit base-origin var.
  if (RAW_BASE && RAW_BASE.trim()) {
    const cleaned = stripTrailingSlash(RAW_BASE.trim());
    try {
      return new URL(cleaned).origin;
    } catch {
      return cleaned;
    }
  }
  // Fall back to VITE_API_URL by stripping a trailing "/api".
  if (RAW_API && RAW_API.trim()) {
    const cleaned = stripTrailingSlash(RAW_API.trim());
    try {
      return new URL(cleaned).origin;
    } catch {
      return cleaned.replace(/\/api$/, "");
    }
  }
  // Local dev default.
  return "http://localhost:8080";
}

/** Backend origin, e.g. "https://truelens-backend-hdip.onrender.com" (no trailing slash). */
export const API_ORIGIN = resolveOrigin();

/** REST base, e.g. "https://truelens-backend-hdip.onrender.com/api". */
export const API_URL = `${API_ORIGIN}/api`;

/**
 * SockJS/STOMP endpoint, e.g. "https://truelens-backend-hdip.onrender.com/ws".
 * Always derived from API_ORIGIN so the scheme matches the backend (https -> SockJS
 * upgrades to wss). Never produces an `http://` URL when API_ORIGIN is https, which
 * is what triggered "An insecure SockJS connection may not be initiated from a page
 * loaded over HTTPS".
 */
export const WS_URL = `${API_ORIGIN}/ws`;
