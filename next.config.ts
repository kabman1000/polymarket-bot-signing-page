/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
