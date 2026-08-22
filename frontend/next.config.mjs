/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  devIndicators: {
    buildActivity: false, 
    appIsrStatus: false,  
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "static.hotdeal.vn" },
      { protocol: "https", hostname: "**.r2.dev" },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
