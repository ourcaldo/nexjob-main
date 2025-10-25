
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint has been moved to /api/public/settings for security reasons
  return res.status(301).json({ 
    error: 'This endpoint has been moved to /api/public/settings/ for security reasons',
    redirect: '/api/public/settings/'
  });
}
