import { toDashboardMetrics } from "@/lib/adapters/toDashboardMetrics";
import { MetricsViewSchema, MetricsDataSchema } from "@/types/metrics";
import { readJsonFromRoot } from "@/test/utils/readJson";

describe("toDashboardMetrics", () => {
  it("adapts metrics view data", async () => {
    const parsedView = MetricsViewSchema.parse(await readJsonFromRoot("metrics.view.json"));
    const adapted = toDashboardMetrics(parsedView);
    expect(adapted.summary).toBeDefined();
    expect(Array.isArray(adapted.pilots)).toBe(true);
  });

  it("accepts aggregated metrics data", async () => {
    const parsedMetrics = MetricsDataSchema.parse(await readJsonFromRoot("metrics.json"));
    const adapted = toDashboardMetrics(parsedMetrics);
    expect(typeof adapted.summary.totalFlights).toBe("number");
    expect(typeof adapted.summary.totalHours).toBe("number");
  });
});
