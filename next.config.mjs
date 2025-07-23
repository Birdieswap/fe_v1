/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, { isServer }) {
    // 기존 svg loader
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    /*
    // ✅ Coinbase Wallet SDK의 HeartbeatWorker를 무시하기 위한 설정
    config.module.rules.push({
      test: /HeartbeatWorker(\.worker)?\.js$/,
      use: "null-loader",
    });

    // ✅ Web Worker compatibility 설정
    config.output.globalObject = "self";
    */

    // ⭐ IndexedDB 오류 해결을 위한 브라우저 폴백 설정 추가
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        //crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        // IndexedDB 관련 polyfill 추가
        //"idb-keyval": false,
      };
    }

    // 서버 사이드에서 브라우저 API 제외
    /*
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        indexeddb: "commonjs indexeddb",
      });
    }.   */

    return config;
  },
  /*
  // ⭐ Next.js 15 호환성: experimental.turbo를 turbopack으로 이동
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },


  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      },
    }
  }, 

  // ⭐ 추가된 성능 최적화 설정
  experimental: {
    esmExternals: true,
  },

  // 빌드 타임아웃 증가 (맥북 환경 최적화)
  staticPageGenerationTimeout: 1000,
*/

  // 이미지 최적화 (맥북 Retina 디스플레이 고려)
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  /*
  typescript: {
    // ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ⭐ Cross-Origin 정책 설정 추가
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          // ⭐ Coinbase Wallet을 위한 추가 CORS 헤더
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  // ⭐ Coinbase Wallet SDK 외부 패키지 처리
  /*experimental: {
    serverExternalPackages: ["@coinbase/wallet-sdk"],
  },*/
};

export default nextConfig;
