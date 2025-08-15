import type { Coordinate } from './geometry';

export type Polygon = number[][]; // [lng, lat][]
export type MultiPolygon = number[][][]; // polygon[]

export function isInPolygon(point: Coordinate, ring: Polygon): boolean {
  const x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInMultiPolygon(point: Coordinate, geom: { type: 'Polygon' | 'MultiPolygon'; coordinates: any }): boolean {
  if (geom.type === 'Polygon') return isInPolygon(point, geom.coordinates[0]);
  if (geom.type === 'MultiPolygon') {
    for (let i = 0; i < geom.coordinates.length; i++) {
      if (isInPolygon(point, geom.coordinates[i][0])) return true;
    }
  }
  return false;
}


