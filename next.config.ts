import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  allowedDevOrigins: ['192.168.0.2'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./public/assets/**/*'],
  },
};

export default nextConfig;
