// Cloudflare Pages Function — Basic Auth gate for the Decap CMS admin area.
// Protects EVERYTHING under /admin/ (index.html, config.yml, JS/CSS assets).
//
// Setup (one-time, in Cloudflare Pages dashboard):
//   Settings → Environment variables → add:
//     ADMIN_USER     (optional, defaults to "admin")
//     ADMIN_PASSWORD (required — keep this as a secret/hidden var)
// The password is compared in-memory against the secret; it is never written to the repo.
//
// How it works:
//   - No/invalid Authorization header  -> 401 + WWW-Authenticate (browser shows native popup)
//   - Valid credentials                -> serve the real static asset via the ASSETS binding
// Note: Basic Auth transmits credentials base64-encoded; safe because Pages serves over HTTPS.

export const onRequest = async (context: { request: Request; env: Record<string, string> }) => {
  const { request, env } = context;
  const expectedUser = env.ADMIN_USER || "admin";
  const expectedPass = env.ADMIN_PASSWORD || "";

  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass && expectedPass !== "") {
        // Authorized — hand off to the static asset pipeline.
        return (env as any).ASSETS.fetch(request);
      }
    } catch {
      // malformed header -> fall through to 401
    }
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Margin Blog Admin"',
    },
  });
};
