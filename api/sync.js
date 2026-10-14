let sharedState = null;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    if (req.body) {
      sharedState = {
        data: req.body,
        syncedAt: new Date().toISOString()
      };
      return res.status(200).json({ success: true, syncedAt: sharedState.syncedAt });
    }
    return res.status(400).json({ success: false, error: 'Empty payload' });
  }

  return res.status(200).json({ success: true, data: sharedState ? sharedState.data : null });
}
