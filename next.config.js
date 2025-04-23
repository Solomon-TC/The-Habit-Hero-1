/** @type {import('next').NextConfig} */

const nextConfig = {
  // Completely exclude Supabase functions from the build
  distDir: ".next",
  pageExtensions: ["tsx", "ts", "jsx", "js", "md", "mdx"],
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

    // Complete exclusion of Supabase Edge Functions
    config.module.rules.push({
      test: /\.(ts|js)$/,
      include: [/supabase\/functions/],
      use: "null-loader",
    });

    // Completely ignore all Deno imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "https://deno.land/std@0.168.0/http/server.ts": false,
      "https://esm.sh/stripe@13.6.0?target=deno": false,
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
