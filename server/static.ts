import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) throw new Error("Could not find build directory. Run: npm run build");
  app.use(express.static(distPath));
  // SPA fallback for all non-API routes
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
