import { existsSync } from "node:fs";
import { pathAtRoot, readJsonFromRoot } from "@/test/utils/readJson";
import { toDashboardMetrics } from "@/lib/adapters/toDashboardMetrics";

async function loadAny() {
  const metrics = pathAtRoot("metrics.json");
  const view = pathAtRoot("metrics.view.json");
  if (existsSync(metrics)) return readJsonFromRoot("metrics.json");
  if (existsSync(view)) return readJsonFromRoot("metrics.view.json");
  throw new Error("Neither metrics.json nor metrics.view.json found at repo root.");
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
