const BACKEND_URL = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

export default async function handler(req, res) {
  const fullUrl = `${BACKEND_URL}/api/documents/upload`;

  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Forward the file upload with multipart/form-data
    const formData = new FormData();

    // Get file from request body (Vercel automatically parses multipart)
    if (req.body && req.body.file) {
      formData.append('file', req.body.file);
    }

    const options = {
      method: 'POST',
      headers: {
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      body: formData,
    };

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
