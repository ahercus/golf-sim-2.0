export type Coordinate = { lat: number; lng: number };

export function distanceYards(a: Coordinate | null | undefined, b: Coordinate | null | undefined): number {
  if (!a || !b) return 0;
  const R = 6371e3;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c * 1.09361;
}

export function bearingBetween(a: Coordinate, b: Coordinate): number {
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  return Math.atan2(dLat, dLng);
}

export function calculatePointAtDistance(start: Coordinate, bearingRad: number, distanceYards: number): Coordinate {
  const R = 6371e3;
  const distanceMeters = distanceYards / 1.09361;
  const lat1 = (start.lat * Math.PI) / 180;
  const lon1 = (start.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) + Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.sin(bearingRad)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.cos(bearingRad) * Math.sin(distanceMeters / R) * Math.cos(lat1),
      Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

export function buildLinearPath(startPos: Coordinate | null | undefined, endPos: Coordinate | null | undefined, numPoints = 50): [number, number][] {
  if (!startPos || !endPos) return [];
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = startPos.lng + (endPos.lng - startPos.lng) * t;
    const lat = startPos.lat + (endPos.lat - startPos.lat) * t;
    points.push([lng, lat]);
  }
  return points;
}


