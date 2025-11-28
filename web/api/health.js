// Simple health check proxy
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://87.106.110.70:3001';

  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
