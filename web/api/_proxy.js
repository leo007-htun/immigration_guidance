// Shared proxy utility for all API endpoints
export async function proxyToBackend(req, res, path) {
  const backendUrl = process.env.BACKEND_URL || 'http://87.106.110.70:3001';
  const fullUrl = `${backendUrl}/api/${path}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

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
