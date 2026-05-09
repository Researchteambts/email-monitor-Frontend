import type { NextConfig } from "next";
import os from "os";

// grab all current machine IPs automatically
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const iface of Object.values(interfaces)) {
    for (const alias of iface ?? []) {
      if (alias.family === "IPv4" && !alias.internal) {
        ips.push(alias.address);
        ips.push(`${alias.address}:3000`);
        ips.push(`${alias.address}:3001`);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalIPs(),  // ← auto-detects every time
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
    ];
  },
};

export default nextConfig;