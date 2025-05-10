/** @type {import('next').NextConfig} */

const nextConfig = {
  // Optimize build output
  distDir: ".next",
  output: "standalone",
  pageExtensions: ["tsx", "ts", "jsx", "js", "md", "mdx"],
  images: {
    domains: [
      "api.dicebear.com",
      "images.unsplash.com",
      "mkrahlftoiiugjfesudw.supabase.co",
    ],
    unoptimized: process.env.NODE_ENV === "production",
    formats: ["image/avif", "image/webp"],
  },
  // No need for explicit favicon configuration with files in public directory
  assetPrefix: "",
  poweredByHeader: false,
  // Ensure tempo-devtools is properly transpiled
  transpilePackages: ["tempo-devtools"],
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

    // Handle static assets with improved configuration
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });

    // Completely ignore all Deno imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "https://deno.land/std@0.168.0/http/server.ts": false,
      "https://esm.sh/stripe@13.6.0?target=deno": false,
      "https://esm.sh/@supabase/supabase-js@2": false,
    };

    // Ensure fallbacks for any other Deno imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "https://deno.land/std@0.168.0/http/server.ts": false,
      "https://esm.sh/stripe@13.6.0?target=deno": false,
      "https://esm.sh/@supabase/supabase-js@2": false,
    };

    return config;
  },
  // Updated experimental options
  serverExternalPackages: [],
  experimental: {
    forceSwcTransforms: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
