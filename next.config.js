/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: false
  },
  images: {
    domains: ['localhost']
  },
  typescript: {
    ignoreBuildErrors: false
  },
  // הפעלת שרת WebSocket
  webpack: (config, { isServer }) => {
    if (isServer) {
      // הפעלת שרת WebSocket רק בצד השרת
      require('./src/server.ts');
    }
    return config;
  }
}

module.exports = nextConfig 