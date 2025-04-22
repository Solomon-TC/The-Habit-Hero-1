/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: [
      "api.dicebear.com",
      "images.unsplash.com",
      "mkrahlftoiiugjfesudw.supabase.co",
    ],
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
      test: /\.ts$/,
      include: /supabase\/functions/,
      use: "null-loader",
    });

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
