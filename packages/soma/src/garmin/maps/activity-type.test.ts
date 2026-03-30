import { describe, expect, it } from "vitest";
import { mapActivityType } from "./activity-type.js";

describe("mapActivityType", () => {
  it("maps running types to Terra Running (8)", () => {
    expect(mapActivityType("RUNNING")).toBe(8);
    expect(mapActivityType("INDOOR_RUNNING")).toBe(8);
    expect(mapActivityType("TRAIL_RUNNING")).toBe(8);
    expect(mapActivityType("TREADMILL_RUNNING")).toBe(8);
  });

  it("maps cycling types to Terra Biking (1)", () => {
    expect(mapActivityType("CYCLING")).toBe(1);
    expect(mapActivityType("INDOOR_CYCLING")).toBe(1);
    expect(mapActivityType("MOUNTAIN_BIKING")).toBe(1);
    expect(mapActivityType("GRAVEL_CYCLING")).toBe(1);
    expect(mapActivityType("VIRTUAL_RIDE")).toBe(1);
  });

  it("maps WALKING to Terra Walking (7)", () => {
    expect(mapActivityType("WALKING")).toBe(7);
  });

  it("maps HIKING to Terra Hiking (35)", () => {
    expect(mapActivityType("HIKING")).toBe(35);
  });

  it("maps swimming types to Terra Swimming (82)", () => {
    expect(mapActivityType("SWIMMING")).toBe(82);
    expect(mapActivityType("OPEN_WATER_SWIMMING")).toBe(82);
    expect(mapActivityType("LAP_SWIMMING")).toBe(82);
    expect(mapActivityType("POOL_SWIMMING")).toBe(82);
  });

  it("maps snow sports correctly", () => {
    expect(mapActivityType("ALPINE_SKIING")).toBe(66);
    expect(mapActivityType("CROSS_COUNTRY_SKIING")).toBe(67);
    expect(mapActivityType("SNOWBOARDING")).toBe(73);
    expect(mapActivityType("SNOWSHOEING")).toBe(74);
  });

  it("maps water sports correctly", () => {
    expect(mapActivityType("ROWING")).toBe(53);
    expect(mapActivityType("INDOOR_ROWING")).toBe(53);
    expect(mapActivityType("KAYAKING")).toBe(40);
    expect(mapActivityType("SAILING")).toBe(59);
    expect(mapActivityType("SURFING")).toBe(81);
    expect(mapActivityType("KITESURFING")).toBe(41);
  });

  it("maps racket sports correctly", () => {
    expect(mapActivityType("TENNIS")).toBe(87);
    expect(mapActivityType("TABLE_TENNIS")).toBe(85);
    expect(mapActivityType("BADMINTON")).toBe(10);
    expect(mapActivityType("SQUASH")).toBe(76);
  });

  it("maps gym/fitness activities correctly", () => {
    expect(mapActivityType("STRENGTH_TRAINING")).toBe(80);
    expect(mapActivityType("CROSSFIT")).toBe(113);
    expect(mapActivityType("YOGA")).toBe(100);
    expect(mapActivityType("PILATES")).toBe(49);
    expect(mapActivityType("HIIT")).toBe(114);
    expect(mapActivityType("ELLIPTICAL")).toBe(25);
    expect(mapActivityType("STAIR_CLIMBING")).toBe(78);
  });

  it("maps team sports correctly", () => {
    expect(mapActivityType("SOCCER")).toBe(29);
    expect(mapActivityType("BASKETBALL")).toBe(11);
    expect(mapActivityType("VOLLEYBALL")).toBe(94);
  });

  it("returns Terra Other (108) for unknown types", () => {
    expect(mapActivityType("UNKNOWN_SPORT" as never)).toBe(108);
    expect(mapActivityType("" as never)).toBe(108);
  });
});
