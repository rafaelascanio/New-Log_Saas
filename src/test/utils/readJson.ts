import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export async function readJsonFromRoot(filename: string): Promise<any> {
  const root = findRepoRoot();
  const filePath = join(root, filename);
  const raw = await readFile(filePath);
  const text = raw
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .replace(/^[\u0000-\u001F]+/, "");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new SyntaxError(`Failed to parse JSON (${filename}): ${(err as Error).message}`);
  }
}
