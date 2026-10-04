import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.43.3"],
  // Media is served by an optimized route handler; keep next/image on the
  // default loader so local uploads get proper responsive variants.
  // Supplied HEIC/HEIF photography is optimized on the fly by sharp.
};

export default nextConfig;
