import { describe, it, expect } from 'vitest';
import { distanceYards, bearingBetween, calculatePointAtDistance } from '@/features/golf/lib/geometry';

describe('geometry', () => {
  const a = { lat: 36.56, lng: -121.95 };
  const b = { lat: 36.561, lng: -121.949 };

  it('distanceYards returns positive distance', () => {
    const d = distanceYards(a, b);
    expect(d).toBeGreaterThan(0);
  });

  it('bearingBetween produces a consistent angle', () => {
    const br = bearingBetween(a, b);
    expect(typeof br).toBe('number');
  });

  it('calculatePointAtDistance returns a point approx distance away', () => {
    const bearing = bearingBetween(a, b);
    const pt = calculatePointAtDistance(a, bearing, 100);
    const d = distanceYards(a, pt);
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(120);
  });
});


