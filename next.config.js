/** @type {import('next').NextConfig} */

const nextConfig = {
  // Optimize build output
  distDir: ".next",
  output: "standalone",
  poweredByHeader: false,
  pageExtensions: ["tsx", "ts", "jsx", "js", "md", "mdx"],
  images: {
    remotePatterns: [
      { hostname: "api.dicebear.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "mkrahlftoiiugjfesudw.supabase.co" },
    ],
    unoptimized: process.env.NODE_ENV === "production",
    formats: ["image/avif", "image/webp"],
  },
  // No need for explicit favicon configuration with files in public directory
  assetPrefix: "",
  poweredByHeader: false,
  // Ensure tempo-devtools and other packages are properly transpiled
  transpilePackages: ["tempo-devtools", "@supabase/ssr"],
  swcMinify: false,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
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
      path: require.resolve("path-browserify"),
    };

    return config;
  },
  experimental: {
    // Enable server actions with increased body size limit
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Force SWC transforms for better compatibility
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
