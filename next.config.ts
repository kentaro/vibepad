import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/vibepad' : '',
  eslint: {
    // 本番ビルド時のESLintチェックを無効化
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 本番ビルド時の型チェックエラーを無視
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
