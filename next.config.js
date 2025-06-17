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
  }
}

module.exports = nextConfig 