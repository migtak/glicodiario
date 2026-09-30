import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** IPs deste computador na rede local, para testar no celular (ex.: http://192.168.x.x:3000). */
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses,
  // no canto de cima, para não cobrir a barra de navegação inferior no celular
  devIndicators: { position: "top-right" },
  async headers() {
    return [
      {
        // o navegador precisa sempre buscar a versão nova do service worker
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
