const StylelintPlugin = require("stylelint-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  webpack: config => {
    // The StylelintPlugin requires the addition to the package.json:
    //   "postcss": "^8.4.18",
    config.plugins.push(new StylelintPlugin());
    return config;
  },
};

module.exports = nextConfig;
