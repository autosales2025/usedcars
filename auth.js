// /api/auth.js — GitHub OAuth bridge for Decap CMS on Vercel
const CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET;

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.endsWith('/api/auth')) {
    const redirect = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=https://${req.headers.host}/api/auth/callback&scope=repo,user:email&state=${Math.random()}`;
    res.writeHead(302, { Location: redirect });
    res.end();
    return;
  }

  if (pathname.endsWith('/api/auth/callback')) {
    const code = url.searchParams.get('code');
    if (!code) {
      res.statusCode = 400;
      res.end('Missing code');
      return;
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    const html = `
      <html><body><script>
        (function(){
          var d=${JSON.stringify(tokenData)};
          window.opener.postMessage('authorization:github:success:' + JSON.stringify({
            token: d.access_token, provider: 'github'
          }), '*');
          window.close();
        })();
      </script></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
}
