import { describe, it, expect } from "vitest";
import { clamp } from "./index";

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("returns min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, -50, 50)).toBe(-50);
  });

  it("returns max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, -50, 50)).toBe(50);
  });

  it("handles negative ranges", () => {
    expect(clamp(-25, -50, -10)).toBe(-25);
    expect(clamp(-5, -50, -10)).toBe(-10);
    expect(clamp(-100, -50, -10)).toBe(-50);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 10, 10)).toBe(10);
    expect(clamp(15, 10, 10)).toBe(10);
  });

  it("handles floating point values", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-0.1, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(0.123456, 0.1, 0.2)).toBeCloseTo(0.123456);
  });

  it("handles Infinity bounds", () => {
    expect(clamp(100, -Infinity, Infinity)).toBe(100);
    expect(clamp(100, 0, Infinity)).toBe(100);
    expect(clamp(-100, -Infinity, 0)).toBe(-100);
  });
});
