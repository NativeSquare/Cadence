import { describe, expect, it } from "vitest";
import { mapSportType } from "./sport-type.js";

describe("mapSportType", () => {
  it("maps cycling sport types to Terra Biking (1)", () => {
    expect(mapSportType("Ride")).toBe(1);
    expect(mapSportType("MountainBikeRide")).toBe(1);
    expect(mapSportType("GravelRide")).toBe(1);
    expect(mapSportType("EBikeRide")).toBe(1);
    expect(mapSportType("EMountainBikeRide")).toBe(1);
    expect(mapSportType("VirtualRide")).toBe(1);
    expect(mapSportType("Velomobile")).toBe(1);
  });

  it("maps running sport types to Terra Running (8)", () => {
    expect(mapSportType("Run")).toBe(8);
    expect(mapSportType("TrailRun")).toBe(8);
    expect(mapSportType("VirtualRun")).toBe(8);
  });

  it("maps Walk to Terra Walking (7)", () => {
    expect(mapSportType("Walk")).toBe(7);
  });

  it("maps Swim to Terra Swimming (82)", () => {
    expect(mapSportType("Swim")).toBe(82);
  });

  it("maps Hike to Terra Hiking (35)", () => {
    expect(mapSportType("Hike")).toBe(35);
  });

  it("maps snow sports correctly", () => {
    expect(mapSportType("AlpineSki")).toBe(66);
    expect(mapSportType("NordicSki")).toBe(67);
    expect(mapSportType("Snowboard")).toBe(73);
    expect(mapSportType("Snowshoe")).toBe(74);
  });

  it("maps water sports correctly", () => {
    expect(mapSportType("Rowing")).toBe(53);
    expect(mapSportType("Kayaking")).toBe(40);
    expect(mapSportType("Sail")).toBe(59);
    expect(mapSportType("Surfing")).toBe(81);
    expect(mapSportType("Kitesurf")).toBe(41);
  });

  it("maps racket sports correctly", () => {
    expect(mapSportType("Tennis")).toBe(87);
    expect(mapSportType("TableTennis")).toBe(85);
    expect(mapSportType("Badminton")).toBe(10);
    expect(mapSportType("Squash")).toBe(76);
  });

  it("maps gym/fitness activities correctly", () => {
    expect(mapSportType("WeightTraining")).toBe(80);
    expect(mapSportType("Crossfit")).toBe(113);
    expect(mapSportType("Yoga")).toBe(100);
    expect(mapSportType("Pilates")).toBe(49);
    expect(mapSportType("HighIntensityIntervalTraining")).toBe(114);
    expect(mapSportType("Elliptical")).toBe(25);
    expect(mapSportType("StairStepper")).toBe(78);
  });

  it("returns Terra Other (108) for unknown types", () => {
    expect(mapSportType("UnknownSport" as never)).toBe(108);
    expect(mapSportType("" as never)).toBe(108);
  });
});
