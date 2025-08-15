// src/shotSimulation.js

// Define potential shot outcomes
export const ShotTypes = {
  PERFECT_STRAIGHT: 'PERFECT_STRAIGHT',
  GOOD_DRAW: 'GOOD_DRAW',
  GOOD_FADE: 'GOOD_FADE',
  PULL: 'PULL',
  PUSH: 'PUSH',
  HOOK: 'HOOK',
  SLICE: 'SLICE',
  THIN: 'THIN',
  FAT: 'FAT',
  SKY: 'SKY',
};

// --- Simulation Parameters (Placeholder - refine later) ---
const YARDS_TO_METERS = 0.9144;
const FEET_TO_METERS = 0.3048;

// --- Simulation Function ---

/**
 * Simulates a golf shot based on club, aim, and a random quality factor.
 * @param {object} club - Club data { name, baseDistanceYards, baseApexFeet }
 * @param {object} aimTarget - Intended target { x, y } relative to ball (in yards)
 * @returns {object} - Simulated shot outcome { landingPoint, apexHeightMeters, curveMeters, shotType, shotDistanceYards }
 */
export function simulateShot(club, aimTarget) {
  // TODO: Implement sophisticated logic based on swing quality randomness
  // For now, let's simulate a PERFECT_STRAIGHT shot directly towards the aimTarget

  const shotType = ShotTypes.PERFECT_STRAIGHT; // Default for now

  const distanceToAim = Math.sqrt(aimTarget.x * aimTarget.x + aimTarget.y * aimTarget.y);
  const aimAngleRad = Math.atan2(aimTarget.y, aimTarget.x);

  // --- Calculate Outcome based on Shot Type ---
  let landingPoint = { x: 0, y: 0 };
  let apexHeightMeters = 0;
  let curveMeters = 0;
  let shotDistanceYards = 0;

  switch (shotType) {
    case ShotTypes.PERFECT_STRAIGHT:
    default:
      // Perfect shot lands exactly at the intended distance along the aim line
      // (For now, assume intended distance = club base distance, ignoring aimTarget distance)
      shotDistanceYards = club.baseDistanceYards;
      landingPoint = {
        x: shotDistanceYards * Math.cos(aimAngleRad),
        y: shotDistanceYards * Math.sin(aimAngleRad),
      };
      apexHeightMeters = club.baseApexFeet * FEET_TO_METERS;
      curveMeters = 0;
      break;

    // TODO: Add cases for other ShotTypes, introducing variations:
    // - landingPoint offset (pull/push)
    // - curveMeters (draw/fade/hook/slice)
    // - apexHeightMeters variation (thin/fat/sky)
    // - shotDistanceYards variation (thin/fat/sky/mishits)
  }

  return {
    landingPoint, // Landing position relative to ball (in yards)
    apexHeightMeters,
    curveMeters, // Max deviation from straight line (in meters) - needs refinement
    shotType,
    shotDistanceYards,
  };
}

// --- Helper Data (Example) ---
export const Clubs = {
  DRIVER: { name: 'Driver', baseDistanceYards: 250, baseApexFeet: 30 },
  IRON_7: { name: '7 Iron', baseDistanceYards: 150, baseApexFeet: 25 },
  WEDGE: { name: 'Wedge', baseDistanceYards: 100, baseApexFeet: 20 },
}; 