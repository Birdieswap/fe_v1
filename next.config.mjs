/** @type {import('next').NextConfig} */

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  trailingSlash: false,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: [
    "app.birdieswap.local",
    "www.birdieswap.local",
    "localhost",
    "127.0.0.1",
  ],

  experimental: {
    // CSS 관련 사전 최적화 (기본 켜져 있음, 명시해 둠)
    optimizeCss: true,
    // 서버/클라이언트 공통 패키지 import 줄여서 번들 안정화
    optimizePackageImports: [
      "@heroui/react",
      "@heroui/theme",
      "@rainbow-me/rainbowkit",
    ],
  },

  compiler: {
    // prod 빌드에서 console.* 제거
    // 에러/경고는 남기고 싶으면 exclude 사용
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  webpack(config, { isServer, dev }) {
    //  dev에서 파일시스템 캐시 대신 메모리 캐시 → ENOENT 방지
    if (dev) {
      config.cache = { type: "memory" }; // 필요시 false도 가능
    }

    // 기존 svg loader
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    //  클라 번들에서 node-fetch 폴백 비활성화(서버 전용)
    if (!isServer) {
      // 브라우저 번들에서 Node 전용 모듈/선택적 의존성 끊기
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        crypto: false,
        "node-fetch": false,
        // 문제가 되는 것들 명시적으로 false
        pngjs: false,
        "quick-format-unescaped": false,
      };

      // pino가 끌고오는 Node 전용 의존성들도 차단(브라우저는 console logger로 다운그레이드)
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
        "pino-abstract-transport": false,
        "sonic-boom": false,
      };
    }

    return config;
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/birdieswap/:path*",
  //       destination: "https://api.birdieswap.com/:path*",
  //     },
  //   ];
  // },

  // // 이건 비워두세요 (같은 경로에 redirect 있으면 안 됨)
  // async redirects() {
  //   return [];
  // },

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },

  typescript: {
    // ignoreBuildErrors: true,
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) return [];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Download-Options", value: "noopen" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), serial=(), display-capture=(), midi=()",
          },
        ],
      },
    ];
  },

};

export default nextConfig;
