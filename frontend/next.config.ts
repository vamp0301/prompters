import path from "node:path";
import type { NextConfig } from "next";

// The browser talks to /api on the frontend's own origin; Next proxies it to the backend.
// This keeps the session cookie first-party (works on Vercel → Render without third-party cookies).
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The repo root also has a package-lock (Neon config); pin the app root explicitly.
  turbopack: { root: path.join(__dirname) },
  // AI-backed API calls (resume parsing, answer evaluation) can take 20–40s, longer when a model is
  // slow and the backend falls back to another one. The default 30s proxy timeout turned those into 500s.
  experimental: { proxyTimeout: 120_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // Microphone is needed by our own pages only (interview recording + dictation); camera is never used.
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
