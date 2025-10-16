/** @type {import('next').NextConfig} */

const securityHeaders = [
  // 이미 vercel에서 HSTS가 있더라도 명시해 두는걸 권장
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // MIME sniffing 방지
  { key: "X-Content-Type-Options", value: "nosniff" },

  // 클릭재킹 방지 (CSP의 frame-ancestors가 우선이지만, 호환 위해 함께 설정)
  { key: "X-Frame-Options", value: "DENY" },

  // 외부 사이트로의 Referer 최소화
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // 브라우저 기능 제한 (필요 시 하나씩 열기)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
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
