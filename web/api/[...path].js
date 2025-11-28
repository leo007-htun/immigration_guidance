// Vercel serverless function to proxy all API requests to backend
// This solves the mixed content issue (HTTPS frontend -> HTTP backend)

export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

  // Get the full path from the request
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  const url = `${backendUrl}/api/${apiPath}`;

  // Get query parameters
  const queryString = new URLSearchParams(req.query).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  try {
    // Forward the request to the backend
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && req.body && {
        body: JSON.stringify(req.body)
      }),
    });

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
      message: error.message
    });
  }
}
