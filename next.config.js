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

    // Add rule to handle Deno imports in Supabase Edge Functions
    config.module.rules.push({
      test: /\.ts$/,
      include: /supabase\/functions/,
      use: [
        {
          loader: "ignore-loader",
        },
      ],
    });

    return config;
  },
};

// Configure experimental features
if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig.experimental = {
    serverComponentsExternalPackages: [],
    // Explicitly enable SWC for font loading
    forceSwcTransforms: true,
  };
}

module.exports = nextConfig;
