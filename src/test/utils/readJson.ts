import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function pathAtRoot(filename: string): string {
  return join(findRepoRoot(), filename);
}

export async function readJsonFromRoot(filename: string): Promise<any> {
  const filePath = pathAtRoot(filename);
  const buf = await readFile(filePath);
  // Strip UTF-8 BOM and any stray control bytes at the start
  const text = buf.toString("utf8").replace(/^\uFEFF/, "").replace(/^[\u0000-\u001F]+/, "");
  return JSON.parse(text);
}
