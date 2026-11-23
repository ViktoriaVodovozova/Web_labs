
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {

      allowedOrigins: ['localhost:8080', '127.0.0.1:8080', 'localhost:3000', 'frontend'],
    },
  },
};

export default nextConfig;