// /api/auth.js
export default function handler(req, res) {
  const { GITHUB_CLIENT_ID, BASE_URL } = process.env;
  if (!GITHUB_CLIENT_ID || !BASE_URL) {
    res.status(500).json({ ok: false, error: 'Missing env vars (GITHUB_CLIENT_ID, BASE_URL)' });
    return;
  }

  // Create a simple state value (ideally use crypto.randomUUID() on Node 18+)
  const state = Math.random().toString(36).slice(2);

  // Persist state briefly in a cookie (so we can compare in callback if you want)
  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const redirectUri = `${BASE_URL}/api/callback`; // must match your GitHub App callback URL
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo,user:email',
    state
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.writeHead(302, { Location: authUrl });
  res.end();
}
