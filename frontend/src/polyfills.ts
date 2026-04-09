// Browser polyfills for legacy modules that expect Node globals.
if (typeof (window as any).global === "undefined") {
  (window as any).global = window;
}

if (typeof (window as any).process === "undefined") {
  (window as any).process = { env: {} };
}
