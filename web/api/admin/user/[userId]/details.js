import { proxyToBackend } from '../../../_proxy.js';

export default async function handler(req, res) {
  // Extract userId from the URL path
  const userId = req.query.userId || req.url.split('/').filter(Boolean)[3];
  return proxyToBackend(req, res, `admin/user/${userId}/details`);
}
