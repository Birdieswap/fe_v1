/** @type {import('next').NextConfig} */

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "img-src 'self' data: https:",
  // inline/eval은 가능한 제거. 초기엔 빌드/라이브러리 때문에 허용 후 점진 축소.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' https:",
  // wagmi / rainbowkit / API / RPC 등 네트워크 호출 허용
  "connect-src 'self' https:",
  // 외부 임베드 금지 (피싱/클릭재킹 방지)
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // 강제로 적용하려면 아래 Content-Security-Policy를 쓰고,
  // 테스트부터 하려면 'Content-Security-Policy-Report-Only' 로 바꿔서 사용.
  { key: "Content-Security-Policy", value: csp },

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
