//next.congig.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // // App Router を有効化
  // experimental: {
  //   appDir: true,
  // },
  
  // 本番用: Standalone 出力を有効化（Cloud Run 最適化）
  output: 'standalone',
  
  // Cloud Run 用ポート設定
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: process.env.ASSET_PREFIX || '',
  }),
  
  // 環境変数設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // セキュリティヘッダー設定
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
  
  // 本番用画像最適化
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // ログ設定
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // 本番用最適化設定
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error'],
      },
    },
    poweredByHeader: false,
  }),
}

module.exports = nextConfig