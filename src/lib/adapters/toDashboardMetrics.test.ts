import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

import { toDashboardMetrics } from "./toDashboardMetrics";
import { MetricsDataSchema, MetricsViewSchema } from "@/types/metrics";

function getRepoRoot(): string {
  return path.resolve(__dirname, "../..");
}

describe("toDashboardMetrics", () => {
  it("adapts metrics view data", async () => {
    const viewPath = path.join(getRepoRoot(), "metrics.view.json");
    const raw = await fs.readFile(viewPath, "utf8");
    const parsed = MetricsViewSchema.parse(JSON.parse(raw));

    const metrics = toDashboardMetrics(parsed);

    expect(metrics.pilots.length).toBeGreaterThan(0);
    const pilot = metrics.pilots[0];
    expect(pilot.id).toBeTruthy();
    expect(pilot.name).toBeTruthy();
    expect(pilot.totalFlights).toBeGreaterThan(0);
    expect(pilot.totalHours).toBeGreaterThan(0);
    expect(pilot.flights.length).toBeGreaterThan(0);

    const identityFields = [
      pilot.licenseNumber,
      pilot.nationality,
      pilot.dateOfBirth,
      pilot.licenseType,
      pilot.licenseIssueDate,
      pilot.licenseExpiryDate,
    ];
    expect(identityFields.some(Boolean)).toBe(true);

    const flightDates = pilot.flights
      .map((flight) => flight.date)
      .filter((value) => Boolean(value))
      .sort();
    if (flightDates.length > 0 && pilot.lastFlightDate) {
      expect(pilot.lastFlightDate).toBe(flightDates[flightDates.length - 1]);
    }

    const hasNightSegment = metrics.pilots.some((p) =>
      p.flights.some((flight) => flight.night === true)
    );
    expect(hasNightSegment).toBe(true);

    const totals = metrics.pilots.reduce(
      (acc, current) => {
        acc.flights += current.totalFlights;
        acc.hours += current.totalHours;
        return acc;
      },
      { flights: 0, hours: 0 }
    );

    expect(metrics.summary.totalFlights).toBe(totals.flights);
    expect(metrics.summary.totalHours).toBeCloseTo(totals.hours, 2);
  });

  it("accepts aggregated metrics data", async () => {
    const metricsPath = path.join(getRepoRoot(), "metrics.json");
    const buffer = await fs.readFile(metricsPath);
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const parsed = MetricsDataSchema.parse(JSON.parse(text));

    const metrics = toDashboardMetrics(parsed);

    expect(metrics.summary.totalFlights).toBeTypeOf("number");
    expect(metrics.summary.totalHours).toBeTypeOf("number");
    if (parsed.generatedAt) {
      expect(metrics.summary.updatedAt).toBeDefined();
    }
  });
});
