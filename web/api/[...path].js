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

    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Forward the request to the backend
    const response = await fetch(fullUrl, options);

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Backend error',
        status: response.status,
        message: errorText
      });
    }

    const contentType = response.headers.get('content-type');

    // Handle JSON response
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return res.status(200).json({ message: 'Empty response from backend' });
      }
      try {
        const data = JSON.parse(text);
        return res.status(response.status).json(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Text:', text);
        return res.status(500).json({
          error: 'Invalid JSON from backend',
          message: text.substring(0, 100)
        });
      }
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
