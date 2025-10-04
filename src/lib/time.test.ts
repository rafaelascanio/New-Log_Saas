import { describe, expect, it } from "vitest";
import { hhmmToDecimal, safeMaxDate, toIsoDate } from "./time";

describe("hhmmToDecimal", () => {
  it("converts hh:mm to decimal hours", () => {
    expect(hhmmToDecimal("02:30")).toBeCloseTo(2.5);
  });

  it("handles numbers", () => {
    expect(hhmmToDecimal("1.75")).toBeCloseTo(1.75);
  });

  it("handles empty and null", () => {
    expect(hhmmToDecimal("")).toBe(0);
    expect(hhmmToDecimal(null)).toBe(0);
    expect(hhmmToDecimal(undefined)).toBe(0);
  });

  it("handles negative values", () => {
    expect(hhmmToDecimal("-01:30")).toBeCloseTo(-1.5);
  });
});

describe("toIsoDate", () => {
  it("returns ISO when already ISO", () => {
    expect(toIsoDate("2024-01-05")).toBe("2024-01-05");
  });

  it("converts slash separated dates", () => {
    expect(toIsoDate("4/12/1990")).toBe("1990-04-12");
  });

  it("converts dash separated dates", () => {
    expect(toIsoDate("4-9-2024")).toBe("2024-04-09");
  });

  it("falls back to parsed date", () => {
    expect(toIsoDate("April 9, 2024")).toBe("2024-04-09");
  });
});

describe("safeMaxDate", () => {
  it("returns undefined for empty", () => {
    expect(safeMaxDate([])).toBeUndefined();
  });

  it("returns max ISO date", () => {
    expect(safeMaxDate(["2024-04-09", "2024-08-01"])).toBe("2024-08-01");
  });

  it("normalizes before comparing", () => {
    expect(safeMaxDate(["4/10/2024", "2024-05-01"])).toBe("2024-05-01");
  });
});
