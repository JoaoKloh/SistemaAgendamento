/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  agentRules: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: [
    '*.trycloudflare.com',
    '*.loca.lt',
    'ron-unphilologic-ricky.ngrok-free.dev',
    'https://marie-anne-api.serveousercontent.com',
    '*.serveousercontent.com',
    '*.serveo.net',
  ],

  // O proxy do BFF agora é o Route Handler em app/api/[...path]/route.ts:
  // ele repassa a chamada para BACKEND_API_URL removendo Origin/Referer do
  // navegador, o que evita o filtro de CORS do Spring rejeitar a chamada
  // (um simples rewrite mantinha esses cabeçalhos e o backend respondia
  // 403 "Invalid CORS request").
}

export default nextConfig