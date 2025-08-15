import rawPebble from './PebbleData.json';
import type { Coordinate } from '@/features/golf/types';

type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: any };
export type HoleSurface = {
  bunkers: Geometry[];
  greens: Geometry[];
  fairway: Geometry[] | Geometry;
  rough: Geometry[];
  water: Geometry[];
  ob: Geometry[];
  teeCenter?: Coordinate;
  greenCenter?: Coordinate;
  teeCoords?: any[];
  greenCoords?: any[];
};

function calculateCentroid(coordinates: any): Coordinate {
  if (!coordinates?.[0]?.length) return { lat: 0, lng: 0 };
  const ring = coordinates[0] as number[][];
  let x = 0, y = 0, area = 0;
  let j = ring.length - 1;
  for (let i = 0; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const cross = xi * yj - xj * yi;
    area += cross; x += (xi + xj) * cross; y += (yi + yj) * cross;
  }
  area /= 2;
  if (area === 0) {
    let sumX = 0, sumY = 0;
    for (let i = 0; i < ring.length - 1; i++) { sumX += ring[i][0]; sumY += ring[i][1]; }
    const denom = Math.max(1, ring.length - 1);
    return { lng: sumX / denom, lat: sumY / denom };
  }
  return { lat: y / (6 * area), lng: x / (6 * area) };
}

function parseHoleNumber(featureName: string): number | null {
  const match = featureName.match(/hole_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseSurfaceType(golfTag: string): keyof HoleSurface | 'other' {
  if (golfTag === 'bunker') return 'bunkers';
  if (golfTag === 'green') return 'greens';
  if (golfTag === 'fairway') return 'fairway';
  return 'other';
}

function buildPebbleData(): Record<number, HoleSurface> {
  const holes: Record<number, HoleSurface> = {} as any;
  (rawPebble.features as any[]).forEach((feature) => {
    const { properties, geometry } = feature;
    const { name = '', golf = '' } = properties ?? {};
    if (!name.includes('pebble_beach_hole_')) return;
    const holeNumber = parseHoleNumber(name);
    if (!holeNumber) return;
    if (!holes[holeNumber]) {
      holes[holeNumber] = { bunkers: [], greens: [], fairway: [], rough: [], water: [], ob: [] } as HoleSurface;
    }
    if (name.includes('water')) { holes[holeNumber].water.push(geometry); return; }
    if (name.includes('_ob')) { holes[holeNumber].ob.push(geometry); return; }
    if (golf === 'tee' && geometry.coordinates) { (holes[holeNumber].teeCoords ||= []).push(geometry.coordinates); }
    if (golf === 'green' && geometry.coordinates) { (holes[holeNumber].greenCoords ||= []).push(geometry.coordinates); }
    const surfaceType = parseSurfaceType(golf) as keyof HoleSurface;
    if (holes[holeNumber][surfaceType as keyof HoleSurface] && surfaceType !== 'other') {
      // @ts-expect-error dynamic key
      holes[holeNumber][surfaceType].push(geometry);
    }
  });
  for (const holeNum in holes) {
    const hole = holes[+holeNum];
    if (hole.teeCoords?.length) hole.teeCenter = calculateCentroid(hole.teeCoords[0]);
    if (hole.greenCoords?.length) hole.greenCenter = calculateCentroid(hole.greenCoords[0]);
    delete hole.teeCoords; delete hole.greenCoords;
  }
  return holes;
}

export const PebbleData: Record<number, HoleSurface> = buildPebbleData();


