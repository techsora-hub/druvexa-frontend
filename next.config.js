/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' }, // Cloudinary thumbnails/posters
    ],
  },
};

module.exports = nextConfig;
