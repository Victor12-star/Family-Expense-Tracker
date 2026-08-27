// Syntax-check every backend JavaScript module without starting the server or
// requiring database credentials. This is safe for CI and pull-request gates.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(path);
    return entry.isFile() && path.endsWith(".js") ? [path] : [];
  });
}

for (const file of javascriptFiles(new URL("../src", import.meta.url).pathname)) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
