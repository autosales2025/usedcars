// /api/callback.js
const BASE_URL      = process.env.BASE_URL;
const CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

module.exports = async (req, res) => {
  if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).send("Missing env vars");
    return;
  }

  const { code, state } = req.query || {};
  if (!code) {
    res.status(400).send('Missing OAuth "code"');
    return;
  }

  try {
    // Exchange code for access_token
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/callback`,
        state,
      }),
    });

    const data = await tokenResp.json();
    if (!data.access_token) {
      res.status(400).send("No access_token from GitHub");
      return;
    }

    // Hand token back to Decap on /admin via hash fragment
    const fragment = new URLSearchParams({
      token: data.access_token,
      provider: "github",
      access_token: data.access_token, // extra key for compatibility
      state: state || "decap",
      token_type: "bearer",
    }).toString();

    res.writeHead(302, { Location: `${BASE_URL}/admin/#${fragment}` });
    res.end();
  } catch (e) {
    res.status(500).send(e.message || "callback error");
  }
};
