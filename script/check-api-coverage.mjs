// Geçici geliştirme aracı: client'ın çağırdığı API yolları ile server'da
// kayıtlı yolları karşılaştırır. Kapsam dışı kalan client çağrılarını raporlar.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const serverFiles = [
  ...walk(path.join(root, "server"), [".ts"]),
  ...walk(path.join(root, "shared"), [".ts"]),
];
const clientFiles = walk(path.join(root, "client", "src"), [".ts", ".tsx"]);

// 1) Server route'ları
const routePatterns = new Set();
for (const f of serverFiles) {
  const src = fs.readFileSync(f, "utf8");
  const re = /\.(get|post|patch|put|delete|all)\(\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const p = m[2];
    if (p.startsWith("/api") || p.startsWith("/auth")) routePatterns.add(p);
  }
}

// 2) Client çağrıları
const clientCalls = new Map(); // path -> [files]
const callRe = /(?:fetch\(|apiRequest\(|url:\s*|request\()\s*[`"']([^`"']*\/api\/[^`"'?]*)[`"']/g;
const tmplRe = /\/api\/[A-Za-z0-9_./: ${}|-]+/g;
for (const f of clientFiles) {
  const src = fs.readFileSync(f, "utf8");
  const seen = new Set();
  const collect = (p) => {
    p = p.replace(/\?.*$/, "").trim();
    if (p.endsWith("/")) p = p.slice(0, -1);
    if (!p.includes("/api/")) return;
    if (!seen.has(p)) {
      seen.add(p);
      const arr = clientCalls.get(p) || [];
      arr.push(path.relative(root, f));
      clientCalls.set(p, arr);
    }
  };
  let m;
  while ((m = callRe.exec(src))) collect(m[1]);
  while ((m = tmplRe.exec(src))) collect(m[0]);
}

// 3) Eşleştirme: /api/x/:id pattern'i /api/x/123 gibi çağrıları karşılar
function matches(call, pattern) {
  if (pattern === call) return true;
  const pp = pattern.split("/").filter(Boolean);
  const cp = call.split("/").filter(Boolean);
  if (pp.length !== cp.length) return false;
  return pp.every((seg, i) => seg.startsWith(":") || seg === cp[i]);
}

const missing = [];
for (const [call, files] of [...clientCalls].sort()) {
  const norm = call.replace(/\$\{[^}]*\}/g, ":x").replace(/:x+/g, ":x");
  const ok = [...routePatterns].some((r) => matches(norm, r));
  if (!ok) missing.push({ call, files });
}

console.log("== SERVER ROUTE SAYISI:", routePatterns.size, "==");
console.log("== CLIENT BENzersiz /api ÇAĞRISI:", clientCalls.size, "==");
console.log("\n== SERVER'DA KARŞILIĞI BULUNAMAYAN CLIENT ÇAĞRILARI ==");

if (missing.length === 0) console.log("(yok)");
for (const m of missing) {
  console.log(`  ${m.call}`);
  console.log(`    -> ${[...new Set(m.files)].join(", ")}`);
}
