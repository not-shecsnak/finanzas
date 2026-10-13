import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Genera .next/standalone: servidor mínimo para la imagen Docker.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NODE_ENV !== "production"),
      },
    ];
  },
};

export default nextConfig;
