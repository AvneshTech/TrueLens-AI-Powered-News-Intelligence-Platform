import { WS_URL } from "../config/env";

/**
 * Returns the SockJS endpoint URL, derived centrally in config/env.ts from the
 * backend origin. Guaranteed to be normalized (no double `//ws`) and to share the
 * backend's scheme (https -> SockJS upgrades to wss), avoiding the
 * "insecure SockJS connection ... over HTTPS" error.
 */
export function getWebSocketUrl(): string {
  return WS_URL;
}
