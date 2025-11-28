const BACKEND_URL = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

// Helper to parse multipart form data
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Extract the API path from the URL
  // The rewrite sends all /api/* to /api/proxy, so we need to extract the original path
  let path = '';

  // Try to get path from the original URL (before rewrite)
  const originalUrl = req.headers['x-vercel-proxied-for'] || req.url;

  if (originalUrl.startsWith('/api/')) {
    // Remove /api/ prefix to get the backend path
    path = originalUrl.substring(5).split('?')[0];
  } else if (req.query.path) {
    // Fallback to query parameter if available
    path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  }

  // Build query string if present
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const fullUrl = `${BACKEND_URL}/api/${path}${queryString}`;

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
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
    };

    // Handle different content types
    const requestContentType = req.headers['content-type'] || '';

    if (requestContentType.includes('multipart/form-data')) {
      // For file uploads, get raw body and forward with proper headers
      const rawBody = await getRawBody(req);
      options.body = rawBody;
      options.headers['Content-Type'] = requestContentType; // Preserve boundary
    } else if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      // For JSON requests
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(req.body);
    }

    // Make request to backend
    const response = await fetch(fullUrl, options);

    // Parse response
    const responseContentType = response.headers.get('content-type');
    let data;

    if (responseContentType && responseContentType.includes('application/json')) {
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
