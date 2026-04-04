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
    // Fallback for Railway/Nixpacks where .git is not in the build context
    const sha = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7);
    const date = new Date().toISOString().slice(0, 10);
    return { commits: sha ?? "?", date };
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
