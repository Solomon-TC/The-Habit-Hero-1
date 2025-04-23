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

export default nextConfig;
