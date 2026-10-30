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
  // The stylesheet goes inline in each page: no request between the HTML and the first paint. Lighthouse's simulated
  // LCP on mobile drops by about 0.2 s, what keeps the landing under the 2.5 s of the public bar (PB-P1).
  experimental: { inlineCss: true },
}

export default config
