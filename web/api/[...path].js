// Vercel serverless function to proxy all API requests to backend
// This solves the mixed content issue (HTTPS frontend -> HTTP backend)

export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

  // Get the full path from the request
  const { path, ...queryParams } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : (path || '');
  const url = `${backendUrl}/api/${apiPath}`;

  // Build query string excluding 'path' parameter
  const queryString = new URLSearchParams(queryParams).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  try {
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
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Forward the request to the backend
    const response = await fetch(fullUrl, options);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const contentType = response.headers.get('content-type');

    // Handle JSON response
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Handle text response
    const text = await response.text();
    return res.status(response.status).send(text);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      url: fullUrl
    });
  }
}
