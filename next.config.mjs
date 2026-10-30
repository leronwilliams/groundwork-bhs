/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // The service worker must always be re-checked so updates ship immediately.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ]
  },
};

export default nextConfig;
