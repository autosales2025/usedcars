// /api/auth.js
module.exports = (req, res) => {
  const BASE_URL  = process.env.BASE_URL;
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

  if (!BASE_URL || !CLIENT_ID) {
    res.status(500).json({ ok: false, error: "Missing env vars" });
    return;
  }

  const state = (req.query.state || "decap").toString();

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", CLIENT_ID);
  authorizeUrl.searchParams.set("scope", "repo,user:email");
  authorizeUrl.searchParams.set("redirect_uri", `${BASE_URL}/api/callback`);
  authorizeUrl.searchParams.set("state", state);

  res.writeHead(302, { Location: authorizeUrl.toString() });
  res.end();
};
