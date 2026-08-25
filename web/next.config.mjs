/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages. NEXT_PUBLIC_BASE_PATH is "/<repo>" in CI.
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
  transpilePackages: ["@pe/shared"],
  experimental: {
    // Allow importing the shared workspace TS source directly.
    externalDir: true,
  },
  webpack: (config) => {
    // The shared package uses NodeNext-style ".js" import specifiers that point at ".ts"
    // source. Teach webpack to try ".ts"/".tsx" first, falling back to real ".js".
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
