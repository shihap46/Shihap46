/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'https://solid-windows-sink.loca.lt',
    'http://10.151.211.73',
    '*.loca.lt',
    '*.trycloudflare.com',
  ],
};
export default nextConfig;

