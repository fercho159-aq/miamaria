import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // `npm run dev:local` compila aparte para convivir con otro `next dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Postgres local de desarrollo: trae su propio .wasm y no se debe empaquetar.
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    qualities: [75, 85],
    // Fotos que sube el panel: Vercel Blob.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  experimental: {
    // Fotos de producto y Excel de inventario.
    serverActions: { bodySizeLimit: '6mb' },
  },
}

export default nextConfig
