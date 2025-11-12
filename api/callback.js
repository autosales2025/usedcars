// api/callback.js
const BASE_URL = process.env.BASE_URL; // e.g. https://usedcars-one.vercel.app
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

module.exports = async (req, res) => {
  try {
    const { code, state } = req.query || {};
    if (!code) {
      res.status(400).send('Missing OAuth "code"');
      return;
    }
    if (!CLIENT_ID || !CLIENT_SECRET || !BASE_URL) {
      res.status(500).send('Missing env vars');
      return;
    }

    // Exchange code for token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/api/callback`,
        state
      })
    });
    const data = await tokenResp.json();

    if (!data.access_token) {
      res.status(400).send('No access_token from GitHub');
      return;
    }

    // Hand the token back to Decap CMS via hash fragment
    // Decap reads #access_token=... on /admin/
    const fragment = new URLSearchParams({
      token: data.access_token,
      provider: 'github',
      // Keep both keys for broader compatibility
      access_token: data.access_token,
      state: state || 'decap',
      token_type: 'bearer'
    }).toString();

    res.writeHead(302, { Location: `${BASE_URL}/admin/#${fragment}` });
    res.end();
  } catch (e) {
    res.status(500).send(e.message || 'callback error');
  }
};

