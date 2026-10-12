import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(projectRoot),
  },
  logging: {
    browserToTerminal: true,
  },
  /* config options here */
};

export default nextConfig;
