// Narrow shape consumed by zone components. The `useQuery` result for
// agoge zones types `_id` and `athleteId` as plain strings (not the branded
// `Id<...>` from agoge's exported `ZoneDoc`), so we can't reuse that type
// directly here.
export type ZoneDoc = {
  threshold?: number;
  boundaries: number[];
  source?: string;
  effectiveFrom: string;
};
