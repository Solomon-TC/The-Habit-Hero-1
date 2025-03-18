/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["api.dicebear.com", "images.unsplash.com"],
  },
  // Ensure SWC is used for compilation
  swcMinify: true,
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
