import { proxyToBackend } from '../_proxy.js';

export default async function handler(req, res) {
  // Forward query parameters for the 'days' parameter
  const queryString = req.url.split('?')[1] || '';
  const path = queryString ? `admin/usage-cost?${queryString}` : 'admin/usage-cost';
  return proxyToBackend(req, res, path);
}
