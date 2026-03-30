import { describe, expect, it } from "vitest";
import { transformAthlete } from "./athlete.js";
import type { DetailedAthlete } from "./types.js";

const baseAthlete: DetailedAthlete = {
  id: 10001,
  username: "carlos_v",
  resource_state: 3,
  firstname: "Carlos",
  lastname: "Velasquez",
  city: "Boulder",
  state: "Colorado",
  country: "US",
  sex: "M",
  premium: true,
  summit: true,
  created_at: "2019-03-12T08:15:00Z",
  updated_at: "2025-12-01T14:22:30Z",
  badge_type_id: 6,
  profile_medium:
    "https://dgalywyr863hv.cloudfront.net/pictures/athletes/10001/10001/2/medium.jpg",
  profile:
    "https://dgalywyr863hv.cloudfront.net/pictures/athletes/10001/10001/2/large.jpg",
  friend: null,
  follower: null,
  follower_count: 342,
  friend_count: 128,
  mutual_friend_count: 0,
  athlete_type: 0,
  date_preference: "%m/%d/%Y",
  measurement_preference: "feet",
  ftp: 310,
  weight: 72.5,
  clubs: [
    {
      id: 5001,
      resource_state: 2,
      name: "Boulder Cycling Club",
      profile_medium:
        "https://dgalywyr863hv.cloudfront.net/pictures/clubs/5001/medium.jpg",
      sport_type: "cycling",
      city: "Boulder",
      state: "Colorado",
      country: "US",
      member_count: 215,
      featured: false,
      verified: true,
      url: "boulder-cycling-club",
    },
  ],
  bikes: [
    {
      id: "b1000001",
      primary: true,
      name: "Specialized Tarmac SL7",
      resource_state: 2,
      distance: 12450600,
    },
    {
      id: "b1000002",
      primary: false,
      name: "Canyon Endurace CF",
      resource_state: 2,
      distance: 5820300,
    },
  ],
  shoes: [
    {
      id: "g1000001",
      primary: true,
      name: "Shimano S-Phyre RC9",
      resource_state: 2,
      distance: 8200000,
    },
  ],
};

describe("transformAthlete", () => {
  it("maps first and last name", () => {
    const result = transformAthlete(baseAthlete);
    expect(result.first_name).toBe("Carlos");
    expect(result.last_name).toBe("Velasquez");
  });

  it("maps location fields", () => {
    const result = transformAthlete(baseAthlete);
    expect(result.city).toBe("Boulder");
    expect(result.state).toBe("Colorado");
    expect(result.country).toBe("US");
  });

  it("maps sex M to male", () => {
    const result = transformAthlete(baseAthlete);
    expect(result.sex).toBe("male");
  });

  it("maps sex F to female", () => {
    const female = { ...baseAthlete, sex: "F" as const };
    const result = transformAthlete(female);
    expect(result.sex).toBe("female");
  });

  it("maps null sex to undefined", () => {
    const noSex = { ...baseAthlete, sex: null };
    const result = transformAthlete(noSex);
    expect(result.sex).toBeUndefined();
  });

  it("maps created_at to joined_provider", () => {
    const result = transformAthlete(baseAthlete);
    expect(result.joined_provider).toBe("2019-03-12T08:15:00Z");
  });

  it("maps bikes and shoes to devices", () => {
    const result = transformAthlete(baseAthlete);
    expect(result.devices).toHaveLength(3);
    expect(result.devices?.[0]).toEqual({
      name: "Specialized Tarmac SL7",
      id: "b1000001",
    });
    expect(result.devices?.[2]).toEqual({
      name: "Shimano S-Phyre RC9",
      id: "g1000001",
    });
  });

  it("handles athlete with null location", () => {
    const noLocation = {
      ...baseAthlete,
      city: null,
      state: null,
      country: null,
    };
    const result = transformAthlete(noLocation);
    expect(result.city).toBeUndefined();
    expect(result.state).toBeUndefined();
    expect(result.country).toBeUndefined();
  });
});
