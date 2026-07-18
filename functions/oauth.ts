/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloudflare Pages Function — GitHub OAuth proxy for Decap CMS.
// Handles both legs of the OAuth flow in a single endpoint:
//   1) GET /oauth                -> redirect browser to GitHub authorize (carries admin URL in `state`)
//   2) GET /oauth?code=...&state -> exchange code for token, redirect back to admin with #access_token
// Requires two Production environment variables in the Cloudflare Pages project:
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
const SITE_URL = "https://margin-blog.pages.dev";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Step 2: GitHub redirected back with ?code=...&state=<encoded admin redirect>
  if (code) {
    const adminRedirect = url.searchParams.get("state")
      ? decodeURIComponent(url.searchParams.get("state") as string)
      : SITE_URL + "/admin/";

    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenJson = await tokenResp.json() as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return new Response("GitHub OAuth 失败：" + JSON.stringify(tokenJson), { status: 400 });
    }
    const sep = adminRedirect.includes("#") ? "&" : "#";
    return new Response(null, {
      status: 302,
      headers: {
        Location: adminRedirect + sep + "access_token=" + accessToken + "&token_type=bearer",
      },
    });
  }

  // Step 1: send the browser to GitHub's authorize endpoint.
  const decapRedirect =
    url.searchParams.get("redirect_uri") ||
    (url.searchParams.get("state") ? decodeURIComponent(url.searchParams.get("state") as string) : SITE_URL + "/admin/");

  const ghAuth =
    "https://github.com/login/oauth/authorize" +
    "?client_id=" + encodeURIComponent(env.GITHUB_CLIENT_ID) +
    "&redirect_uri=" + encodeURIComponent(SITE_URL + "/oauth") +
    "&scope=" + encodeURIComponent("repo") +
    "&state=" + encodeURIComponent(decapRedirect);

  return new Response(null, { status: 302, headers: { Location: ghAuth } });
};
