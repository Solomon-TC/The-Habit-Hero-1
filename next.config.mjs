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
  // SWC is used by default in Next.js 15+
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
  // Explicitly tell Next.js to ignore Supabase Edge Functions
  serverExternalPackages: [],
  experimental: {
    forceSwcTransforms: true,
    // Exclude Supabase functions from server components
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
