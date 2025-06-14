/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  images: {
    domains: ['lockerweb.vercel.app']
  },
  typescript: {
    ignoreBuildErrors: false
  }
}

module.exports = nextConfig 