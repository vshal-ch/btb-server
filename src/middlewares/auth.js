export function verifyApiKey(req, res, next) {
  const provided = req.header("x-api-key");
  if (!provided) {
    return res.status(401).json({ success: false, error: "Missing x-api-key" });
  }
  if (provided !== process.env.API_KEY) {
    return res.status(403).json({ success: false, error: "Invalid API key" });
  }
  return next();
}
