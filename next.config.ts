import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El snapshot en data/ debe viajar con el deploy: sirve de semilla del
  // Blob la primera vez (ver src/lib/store.ts).
  outputFileTracingIncludes: {
    "/": ["./data/**"],
    "/api/sismos": ["./data/**"],
  },
};

export default nextConfig;
