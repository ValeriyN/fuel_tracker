import type { NextConfig } from "next";
import { execSync } from "child_process";

function gitInfo() {
  try {
    const commits = execSync("git rev-list --count HEAD", { stdio: ["pipe", "pipe", "pipe"] })
      .toString().trim();
    const date = execSync("git log -1 --format=%cs", { stdio: ["pipe", "pipe", "pipe"] })
      .toString().trim();
    return { commits, date };
  } catch {
    return { commits: "0", date: "unknown" };
  }
}

const { commits, date } = gitInfo();

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  env: {
    NEXT_PUBLIC_GIT_COMMITS: commits,
    NEXT_PUBLIC_GIT_DATE: date,
  },
};

export default nextConfig;
