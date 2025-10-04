import { readJsonFromRoot } from "@/test/utils/readJson";
import { toDashboardMetrics } from "@/lib/adapters/toDashboardMetrics";

async function loadAny() {
  try {
    return await readJsonFromRoot("metrics.json");
  } catch {}
  return await readJsonFromRoot("metrics.view.json");
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
