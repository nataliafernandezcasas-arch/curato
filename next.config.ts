import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Routes renamed to /storyteller(s). Keep old links (already-sent emails,
  // shared /creadores links) working with permanent redirects.
  async redirects() {
    return [
      { source: "/dashboard/influencer", destination: "/dashboard/storyteller", permanent: true },
      { source: "/dashboard/influencer/:path*", destination: "/dashboard/storyteller/:path*", permanent: true },
      { source: "/creadores", destination: "/storytellers", permanent: true },
    ];
  },
};

export default nextConfig;
