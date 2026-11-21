/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      // Разрешаем Server Actions работать через наш Nginx на порту 8080
      allowedOrigins: ['localhost:8080', '127.0.0.1:8080', 'localhost:3000', 'frontend'],
    },
  },
};

export default nextConfig;