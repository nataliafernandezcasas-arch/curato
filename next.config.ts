import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El PDF del compromiso lee sus letras e imágenes del disco al firmar.
  outputFileTracingIncludes: {
    "/onboarding/maison": ["./src/lib/assets/**/*"],
    // El informe del mes en PDF usa las mismas letras e imágenes.
    "/api/maison/report/pdf": ["./src/lib/assets/**/*"],
  },
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
