/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: [
      "api.dicebear.com",
      "images.unsplash.com",
      "mkrahlftoiiugjfesudw.supabase.co",
    ],
    unoptimized: process.env.NODE_ENV === "production",
  },
  // Ensure SWC is used for compilation
  swcMinify: true,
  // Disable webpack persistent caching to prevent file system errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }

    // Exclude Supabase Edge Functions from the build
    config.module.rules.push({
      test: /\.(ts|js)$/,
      include: /supabase\/functions/,
      use: "null-loader",
    });

    // Also exclude any imports from deno.land
    config.resolve.alias = {
      ...config.resolve.alias,
      "https://deno.land/std@0.168.0/http/server.ts": "path-browserify",
      "https://esm.sh/stripe@13.6.0?target=deno": "stripe",
    };

    return config;
  },
  // Explicitly tell Next.js to ignore Supabase Edge Functions
  transpilePackages: [],
  experimental: {
    serverComponentsExternalPackages: [],
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
