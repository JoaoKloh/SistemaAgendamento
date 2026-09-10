/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig