import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Storyteller dashboard route renamed from /dashboard/influencer.
  // Keep old links (e.g. already-sent emails) working.
  async redirects() {
    return [
      { source: "/dashboard/influencer", destination: "/dashboard/storyteller", permanent: true },
      { source: "/dashboard/influencer/:path*", destination: "/dashboard/storyteller/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
