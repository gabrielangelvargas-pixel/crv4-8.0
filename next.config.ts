import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Las fotos de productos viajan en el formulario; se achican en el servidor.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
