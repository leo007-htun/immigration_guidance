const BACKEND_URL = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

export default async function handler(req, res) {
  // Extract the API path from the request
  const path = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : req.query.path || '';

  const fullUrl = `${BACKEND_URL}/api/${path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Prepare request options
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
    };

    // Add body for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Make request to backend
    const response = await fetch(fullUrl, options);

    // Parse response
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Send response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      url: fullUrl
    });
  }
}
