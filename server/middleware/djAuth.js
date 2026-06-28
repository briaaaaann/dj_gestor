export function djAuth(req, res, next) {
  const pin = req.headers['x-dj-pin'];
  if (!pin || pin !== process.env.DJ_PIN) {
    return res.status(401).json({ error: 'PIN incorrecto' });
  }
  next();
}
