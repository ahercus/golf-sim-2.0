// src/courseData/PebbleData.js
import rawPebble from './PebbleData.json';

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
      };
    }

    // Check for explicit "water" in the name
    if (name.includes('water')) {
      holes[holeNumber].water.push(geometry);
      return;
    }

    // Otherwise, rely on golfTag logic
    const surfaceType = parseSurfaceType(golf);
    if (holes[holeNumber][surfaceType]) {
      holes[holeNumber][surfaceType].push(geometry);
    } else {
      if (!holes[holeNumber].other) {
        holes[holeNumber].other = [];
      }
      holes[holeNumber].other.push(geometry);
    }
  });

  return holes;
}

const pebbles = buildPebbleData();
export const PebbleData = pebbles;
