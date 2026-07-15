// api/env.js — Vercel Serverless Function
// Mengekspos SUPABASE_URL dan SUPABASE_ANON_KEY ke frontend secara aman
// Endpoint: GET /api/env

export default function handler(req, res) {
  // Hanya ekspos variabel yang aman (bukan secret keys)
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 jam

  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
  });
}
