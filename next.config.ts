import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: servidor mínimo para la imagen Docker.
  output: "standalone",
};

export default nextConfig;
