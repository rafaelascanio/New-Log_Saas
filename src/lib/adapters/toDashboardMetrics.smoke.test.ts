import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { toDashboardMetrics } from "@/lib/adapters/toDashboardMetrics";

async function loadAny() {
  const root = process.cwd();
  const candidates = ["metrics.json", "metrics.view.json"];

  for (const candidate of candidates) {
    try {
      const contents = await readFile(join(root, candidate), "utf8");
      return JSON.parse(contents);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error("No metrics.json or metrics.view.json fixture available for smoke test");
}

test("dashboard adapter smoke", async () => {
  const input = await loadAny();
  const metrics = toDashboardMetrics(input);

  expect(typeof metrics.summary.totalFlights).toBe("number");
  expect(typeof metrics.summary.totalHours).toBe("number");
  expect(Array.isArray(metrics.pilots)).toBe(true);

  if (metrics.pilots.length > 0) {
    expect(typeof metrics.pilots[0].id).toBe("string");
    expect(typeof metrics.pilots[0].name).toBe("string");
  }
});
