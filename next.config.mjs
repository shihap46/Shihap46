/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // GitHub Pages serves this project from /Shihap46, while local builds stay at /.
  basePath: process.env.GITHUB_PAGES === 'true' ? '/Shihap46' : '',
  experimental: {
    cpus: 1,
  },
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

