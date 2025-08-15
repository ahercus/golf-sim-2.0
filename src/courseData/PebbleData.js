// src/courseData/PebbleData.js
import rawPebble from './PebbleData.json';

// Helper function to calculate the centroid of a polygon
// Handles simple polygons (first ring of coordinates)
function calculateCentroid(coordinates) {
  if (!coordinates || !coordinates.length || !coordinates[0].length) {
    console.warn("Invalid coordinates for centroid calculation:", coordinates);
    return { lat: 0, lng: 0 }; // Return default/invalid point
  }
  // Use the first ring for calculation
  const ring = coordinates[0];
  let x = 0;
  let y = 0;
  let area = 0;
  let j = ring.length - 1;

  for (let i = 0; i < ring.length; j = i++) {
    const xi = ring[i][0]; // lng
    const yi = ring[i][1]; // lat
    const xj = ring[j][0]; // lng
    const yj = ring[j][1]; // lat

    const crossProduct = xi * yj - xj * yi;
    area += crossProduct;
    x += (xi + xj) * crossProduct;
    y += (yi + yj) * crossProduct;
  }

  area /= 2;

  // Avoid division by zero for degenerate polygons
  if (area === 0) {
     // Fallback: average of coordinates (simple mean)
     let sumX = 0;
     let sumY = 0;
     for(let i = 0; i < ring.length -1; i++) { // Exclude duplicate end point
        sumX += ring[i][0];
        sumY += ring[i][1];
     }
     if (ring.length > 1) {
        return { lng: sumX / (ring.length -1), lat: sumY / (ring.length - 1) }
     } else {
        return { lng: ring[0] ? ring[0][0] : 0, lat: ring[0] ? ring[0][1] : 0 }; // Or return first point
     }
  }

  x = x / (6 * area);
  y = y / (6 * area);

  // Return lat, lng
  return { lat: y, lng: x };
}

function parseHoleNumber(featureName) {
  const match = featureName.match(/hole_(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function parseSurfaceType(golfTag) {
  if (golfTag === 'bunker') return 'bunkers';
  if (golfTag === 'green')  return 'greens';
  if (golfTag === 'fairway') return 'fairway';
  return 'other';
}

function buildPebbleData() {
  const holes = {};

  rawPebble.features.forEach(feature => {
    const { properties, geometry } = feature;
    const { name = '', golf = '' } = properties;

    if (!name.includes('pebble_beach_hole_')) return;
    const holeNumber = parseHoleNumber(name);
    if (!holeNumber) return;

    if (!holes[holeNumber]) {
      holes[holeNumber] = {
        bunkers: [],
        greens: [],
        fairway: [],
        rough: [],
        water: [],
        ob: [], // Added OB explicitly
        teeCoords: [], // Store potential tee box coordinates
        greenCoords: [], // Store potential green coordinates
        // Centers will be calculated later
      };
    }

    // Check for explicit "water" in the name
    if (name.includes('water')) {
      holes[holeNumber].water.push(geometry);
      return;
    }
     // Check for explicit "ob" (Out of Bounds) in the name
    if (name.includes('_ob')) { // Assuming OB areas are named like _ob
      holes[holeNumber].ob.push(geometry);
      return;
    }

    // Store tee and green coordinates for centroid calculation
    if (golf === 'tee' && geometry.coordinates) {
        holes[holeNumber].teeCoords.push(geometry.coordinates);
    }
    if (golf === 'green' && geometry.coordinates) {
        holes[holeNumber].greenCoords.push(geometry.coordinates);
    }

    // Otherwise, rely on golfTag logic for surface types
    const surfaceType = parseSurfaceType(golf);
    if (holes[holeNumber][surfaceType]) {
      holes[holeNumber][surfaceType].push(geometry);
    } else {
      // Consider unclassified areas as rough implicitly or add to 'other'
      // For simplicity, we don't add to rough here, detection logic handles default
    }
  });

  // Post-process to calculate centroids
  for (const holeNum in holes) {
    const hole = holes[holeNum];
    if (hole.teeCoords.length > 0) {
      // Simple strategy: Use the first tee box found
      hole.teeCenter = calculateCentroid(hole.teeCoords[0]);
    }
    if (hole.greenCoords.length > 0) {
      // Simple strategy: Use the first green found
      hole.greenCenter = calculateCentroid(hole.greenCoords[0]);
    }
    // Clean up temporary coordinate arrays
    delete hole.teeCoords;
    delete hole.greenCoords;
  }

  return holes;
}

const pebbles = buildPebbleData();
export const PebbleData = pebbles;
