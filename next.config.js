const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

// PWA temporarily disabled to fix CacheStorage errors
// const withPWA = require("next-pwa")({
//   dest: "public"
// })

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["framer-motion"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ["sharp", "onnxruntime-node"]
  }
})
