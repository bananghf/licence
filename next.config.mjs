/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin.html" },
    ];
  },
};

export default nextConfig;
