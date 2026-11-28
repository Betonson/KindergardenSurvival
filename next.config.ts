import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/collection/art/*": ["./content/collection/art/*.webp"] },
  poweredByHeader: false,
};

export default config;
