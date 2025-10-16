/** @type {import('next').NextConfig} */

const basicCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' https:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  webpack(config, { isServer }) {
    // 기존 svg loader
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    //  IndexedDB 오류 해결을 위한 브라우저 폴백 설정 추가
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

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // 이미지 최적화 (맥북 Retina 디스플레이 고려)
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  typescript: {
    // ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
