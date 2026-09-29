import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** IPs deste computador na rede local, para testar no celular (ex.: http://192.168.x.x:3000). */
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses,
};

export default nextConfig;
