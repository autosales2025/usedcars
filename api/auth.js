// /api/auth.js
// Temporary test endpoint to verify Vercel serverless function works.

export default function handler(req, res) {
  // Respond with a simple JSON message
  res.status(200).json({
    ok: true,
    message: "Auth endpoint active",
    method: req.method,
    time: new Date().toISOString()
  });
}
