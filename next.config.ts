import type { NextConfig } from 'next'

// Fully static: every page is rendered at build time and served by nginx (Dockerfile). No server runtime, so
// nothing on the request path can be slow or fail.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  pageExtensions: ['ts', 'tsx'],
}

export default config
