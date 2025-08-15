import { describe, it, expect } from 'vitest';
import { isInPolygon, isInMultiPolygon } from '@/features/golf/lib/collision';

describe('collision', () => {
  it('point-in-polygon basic', () => {
    const ring = [[0,0],[1,0],[1,1],[0,1],[0,0]] as any;
    expect(isInPolygon({ lat: 0.5, lng: 0.5 }, ring)).toBe(true);
    expect(isInPolygon({ lat: 2, lng: 2 }, ring)).toBe(false);
  });

  it('point-in-multipolygon', () => {
    const mp = { type: 'MultiPolygon', coordinates: [
      [[[0,0],[1,0],[1,1],[0,1],[0,0]]],
      [[[2,2],[3,2],[3,3],[2,3],[2,2]]]
    ] } as any;
    expect(isInMultiPolygon({ lat: 0.2, lng: 0.2 }, mp)).toBe(true);
    expect(isInMultiPolygon({ lat: 2.2, lng: 2.2 }, mp)).toBe(true);
    expect(isInMultiPolygon({ lat: 1.5, lng: 1.5 }, mp)).toBe(false);
  });
});


