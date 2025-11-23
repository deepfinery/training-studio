/** @type {import('next').NextConfig} */
const backendBase = (process.env.BACKEND_INTERNAL_BASE ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
