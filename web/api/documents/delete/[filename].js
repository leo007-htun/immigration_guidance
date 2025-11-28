const BACKEND_URL = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

export default async function handler(req, res) {
  const filename = req.query.filename || req.url.split('/').filter(Boolean).pop();
  const fullUrl = `${BACKEND_URL}/api/documents/delete/${filename}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
    };

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const response = await fetch(fullUrl, options);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      url: fullUrl
    });
  }
}
