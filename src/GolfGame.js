import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import Map, { Marker, Source, Layer, FlyToInterpolator } from 'react-map-gl';
import AimingOverlay from './AimingOverlay'; // <<< Import the new component
import PlayerInfoBox from './PlayerInfoBox'; // <<< Import the new component

// Data Imports
import { PebbleData } from './courseData/PebbleData.js';
import { HoleMetadata } from './courseData/HoleMetadata.js';

// Style Imports
import { modernStyles } from './styles/GameStyles.js';

// Utility Imports
import {
    createThreadMessage,
    createRun,
    fetchAssistantMessage,
    askOpenAI // <<< Add askOpenAI here
} from './utils/openaiUtils.js';

// Constants
// const ASSISTANT_ID = "asst_2MmxTf13uHuYYARbEsDX4Sdm";
// const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN;
console.log("MAPBOX_TOKEN available:", !!MAPBOX_TOKEN, "Value:", MAPBOX_TOKEN?.substring(0, 10) + "...");
const TRACER_DURATION_MS = 1500; // Animation duration for the tracer
const TRACER_POINTS = 50; // Number of points in the tracer line

// <<< ADDED: Hole Descriptions from Notepad >>>
const holeDescriptions = {
    1: "Par 4, 344 yards. Gentle warm-up hole doglegs right. Landing area at dogleg is narrow, pinched by trees (right) and bunkers (left). Green is long, skinny, tilts back-to-front towards ocean. Bunker complexes flank green.",
    2: "Par 5, 509 yards. Reachable in two. Elevated tee. Fairway bunkers right and left. Narrow chute of trees and barranca can intimidate layups. Demanding green site hemmed by bunkers.",
    3: "Par 4, 384 yards. Angular fairway, tough to hit. Taking on trees left sets up short iron. Bailing right risks fairway bunkers/rough. First ocean glimpse. Two bunkers right guard green. Green slants right-to-left towards another bunker.",
    4: "Par 4, 308 yards. Plays like target golf. Climbs uphill along ocean cliffs (right). Tiny green. Most use hybrid/wood to avoid 5 left bunkers. Three large, narrow bunkers encircle green.",
    5: "Par 3, 187 yards. Built by Nicklaus (1998) along cliffs over Stillwater Cove. Wind is key. Front left quadrant of green slopes to ocean. 3 bunkers right catch shots heading to cliffs. Bunker left is tough leave.",
    6: "Par 5, 496 yards. Dramatic clifftop terrain. Drive between cliffs (right) and 5 bunkers (left). Steep, rough-laden hill (4 stories high) for second shot (often blind). 5 more bunkers await up top.",
    7: "Par 3, 107 yards. Famous short hole. Downhill wedge, but wind/pressure matter. 6 greenside bunkers. Missing green likely means water.",
    8: "Par 4, 395 yards. Nicklaus' favorite par 4. Blind tee shot along water. Fairway runs out ~240 yards. Requires ~185-yard carry over coastal chasm to landing zone with 5 bunkers. Enlarged green, softened slopes.",
    9: "Par 4, 437 yards. Difficult. Well-struck drives can catch speed slot. Cut shot off left fairway bunker ideal. Deep bunker guards front left green. Worst shots end up on Carmel Beach.",
    10: "Par 4, 429 yards. Widest fairway, slopes hard toward Carmel Beach. 3 large bunkers left. Hanging, sloping lie common. Green open in front (allows bouncing shots). Front left bunker often in play due to cliff fear.",
    11: "Par 4, 367 yards. Moves inland. Climbs uphill, blind shot to tricky fairway. Diagonal green reshaped. Four greenside bunkers.",
    12: "Par 3, 173 yards. Tricky par 3 in forest. Unforgiving green. Four bunkers create only two entry points: high shots or accurate approach through tiny front gate feeding ball left towards ocean.",
    13: "Par 4, 391 yards. Used to be narrow tree chute (some removed). Uphill, plays longer. Driver makes sense. Long bunker left, 3 bunkers right. Two more greenside bunkers pinch front of tough-to-read green.",
    14: "Par 5, 542 yards. Demanding uphill. Not reachable in two. Doglegs hard right, climbs uphill past mansions. Blind tee shot (bunkers left/right). Positioning critical for approach to upper shelf green above deep bunker.",
    15: "Par 4, 376 yards. Easiest hole? Tee shot over bushy barranca. Fairway pinched by rough (right) and 5 bunkers (left). OB right (road). Three bunkers ring green sloping left (ocean).",
    16: "Par 4, 374 yards. Tactical short par 4, often hybrid/wood off tee. Dogleg right. Fairway target is single cypress tree. Fairway small/pitched past 2 right bunkers. Sidehill lies common. Pair of trees guard entry to severely tilted right-to-left green. Sandy barranca/front bunker catch deflected balls.",
    17: "Par 3, 175 yards. Historic site (Nicklaus/Watson shots). Flat landscape. Hourglass-shaped green near water. Front hole locations give up birdies, back corner difficult between 7 bunkers.",
    18: "Par 5, 515 yards. Famous finisher. Likely 3-shotter. Fairway bunkers and tree complicate right shots. Snap hooks left go into Stillwater Cove. Long fairway bunker left from 150 yards in. Tree branches or front right bunker complicate approaches."
};

// --- Utility Functions (Moved from index.js) ---

function distanceYards(a, b) {
  if (!a || !b || !("lat" in a) || !("lng" in a) || !("lat" in b) || !("lng" in b)) {
    console.warn("distanceYards invalid points:", a, b);
    return 0;
  }
  const R = 6371e3;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return (R * c) * 1.09361;
}

function isInPolygon(point, ring) {
  if (!point || !ring) return false;
  const x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi) / (yj - yi) + xi));
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInMultiPolygon(point, geom) {
  if (!geom) return false;
  if (geom.type === "Polygon") {
    return isInPolygon(point, geom.coordinates[0]);
  }
  if (geom.type === "MultiPolygon") {
    for (let i = 0; i < geom.coordinates.length; i++) {
      const outer = geom.coordinates[i][0];
      if (isInPolygon(point, outer)) {
        return true;
      }
    }
  }
  return false;
}

function detectCollision(landingSpot, holeNumber) {
  const holeData = PebbleData[holeNumber];
  if (!holeData) {
    console.warn(`No collision data found for hole ${holeNumber}`);
    return "rough"; // Default if hole data is missing
  }

  // Check Order: OB, Water, Green, Bunker, Fairway, Rough (default)
  if (holeData.ob) {
    for (const obPoly of holeData.ob) {
      if (isInMultiPolygon(landingSpot, obPoly)) return "ob";
    }
  }
  if (holeData.water) {
    for (const waterPoly of holeData.water) {
      if (isInMultiPolygon(landingSpot, waterPoly)) return "water";
    }
  }
  if (holeData.greens) {
    for (const greenPoly of holeData.greens) {
      if (isInMultiPolygon(landingSpot, greenPoly)) return "green";
    }
  }
  if (holeData.bunkers) {
    for (const bunkerPoly of holeData.bunkers) {
      if (isInMultiPolygon(landingSpot, bunkerPoly)) return "bunker";
    }
  }
  if (holeData.fairway) {
    const fairways = Array.isArray(holeData.fairway) ? holeData.fairway : [holeData.fairway];
    for (const fw of fairways) {
      if (isInMultiPolygon(landingSpot, fw)) return "fairway";
    }
  }
  return "rough";
}

function bearingBetween(a, b) {
  if (!a || !b || !("lat" in a) || !("lng" in a) || !("lat" in b) || !("lng" in b)) return 0;
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  return Math.atan2(dLat, dLng);
}

function findOBEntryPoint(start, end, holeNumber) {
  let steps = 50;
  const latInc = (end.lat - start.lat) / steps;
  const lngInc = (end.lng - start.lng) / steps;
  let prev = { ...start };
  for (let i = 1; i <= steps; i++) {
    const testPos = { lat: start.lat + latInc * i, lng: start.lng + lngInc * i };
    if (detectCollision(testPos, holeNumber) === "ob") {
      return {
        lat: prev.lat + latInc * 0.5,
        lng: prev.lng + lngInc * 0.5
      };
    }
    prev = testPos;
  }
  return end;
}

// <<< NEW: Helper to calculate coordinates at a distance and bearing >>>
function calculatePointAtDistance(start, bearingRad, distanceYards) {
  const R = 6371e3; // Earth's radius in meters
  const distanceMeters = distanceYards / 1.09361;
  const lat1 = start.lat * Math.PI / 180;
  const lon1 = start.lng * Math.PI / 180;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceMeters / R) +
                         Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.sin(bearingRad));
  const lon2 = lon1 + Math.atan2(Math.cos(bearingRad) * Math.sin(distanceMeters / R) * Math.cos(lat1),
                                Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2));

  return {
    lat: lat2 * 180 / Math.PI,
    lng: lon2 * 180 / Math.PI
  };
}

// --- OpenAI Assistant Functions (Moved from index.js) ---

// async function createThread() { ... }
// async function createThreadMessage(thread_id, role, userMsg) { ... }
// async function createRun(thread_id) { ... }
// async function fetchAssistantMessage(thread_id) { ... }

// --- Constants for Golf Logic ---
const CLUB_BASE_DISTANCE = {
  "Driver": 275,
  "3 Wood": 240,
  "5 Wood": 230,
  "3 Iron": 210,
  "4 Iron": 200,
  "5 Iron": 190,
  "6 Iron": 180,
  "7 Iron": 165,
  "8 Iron": 150,
  "9 Iron": 140,
  "Pitching Wedge": 130,
  "Gap Wedge": 110,
  "Sand Wedge": 100,
  "Lob Wedge": 90
};

const LIE_MULTIPLIER = {
  tee: 1.0,
  fairway: 0.95,
  rough: 0.8,
  bunker: 0.6, // Adjusted bunker penalty slightly
  green: 1.0 // No penalty on green (for putting logic if added)
};

const BASE_ANGLE_SCATTER_DEG = 3; // Base angle scatter before multipliers
const BASE_DISTANCE_SCATTER_PCT = 0.05; // Base distance scatter (5%) before multipliers

// Add a helper to parse OpenAI JSON response
function parseOpenAIResponse(responseString) {
  try {
    // Attempt to find JSON within potentially messy string output
    const jsonMatch = responseString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate required fields
      if (typeof parsed.strokes_added === 'number' &&
          typeof parsed.final_lie === 'string' &&
          typeof parsed.commentary === 'string') {
        return parsed;
      }
    }
    console.warn("Failed to parse valid JSON from OpenAI:", responseString);
    return null; // Indicate failure
  } catch (error) {
    console.error("Error parsing OpenAI JSON:", error, responseString);
    return null; // Indicate failure
  }
}

// --- NEW Helper Functions ---

function rollDice(sides) {
  return Math.floor(Math.random() * Math.max(1, sides)) + 1;
}

function getVariabilityDiceSize(handicap, factorWeight = 1.0) {
  const hcp = Math.max(0, Math.min(36, handicap));
  const baseSides = 2;
  const maxWeightedSides = baseSides + (18 * Math.min(1.5, factorWeight));
  const sides = baseSides + Math.round((hcp / 36) * (maxWeightedSides - baseSides));
  return Math.max(baseSides, Math.min(20, Math.round(sides)));
}

function calculateMishit(handicap) {
  const hcp = Math.max(0, Math.min(36, handicap));
  if (hcp < 1) return { isMishit: false };

  const roll = rollDice(100);
  if (roll <= hcp) {
    const typeRoll = rollDice(10);
    let type = 'duff';
    if (typeRoll <= 2) type = 'shank';
    else if (typeRoll <= 4) type = 'top';
    else if (typeRoll <= 7) type = 'chunk';
    console.log(`MISHIT (${hcp}% chance): Rolled ${roll} <= ${hcp}. Type: ${type}`);
    return { isMishit: true, type: type };
  }
  return { isMishit: false };
}

function calculateMishitOutcome(mishitType, startPos, intendedDist, targetAngleRad, holeNumber) {
  console.log(`Calculating outcome for mishit type: ${mishitType}`);
  let distMultiplier = 0.1;
  let angleOffsetDeg = (Math.random() - 0.5) * 10;
  let initialLieGuess = 'rough';

  switch (mishitType) {
    case 'duff':
      distMultiplier = 0.05 + Math.random() * 0.15;
      angleOffsetDeg += (Math.random() - 0.5) * 10;
      initialLieGuess = Math.random() < 0.2 ? 'fairway' : 'rough';
      break;
    case 'chunk':
      distMultiplier = 0.2 + Math.random() * 0.3;
      angleOffsetDeg += (Math.random() - 0.5) * 15;
      initialLieGuess = 'rough';
      break;
    case 'top':
      distMultiplier = 0.4 + Math.random() * 0.4;
      angleOffsetDeg += (Math.random() - 0.5) * 8;
      initialLieGuess = Math.random() < 0.4 ? 'fairway' : 'rough';
      break;
    case 'shank':
      distMultiplier = 0.3 + Math.random() * 0.3;
      angleOffsetDeg += 30 + Math.random() * 25;
      initialLieGuess = Math.random() < 0.05 ? 'fairway' : 'rough';
      break;
    default:
      distMultiplier = 0.05 + Math.random() * 0.15;
      angleOffsetDeg += (Math.random() - 0.5) * 10;
      break;
  }

  const finalDistance = intendedDist * distMultiplier;
  const finalAngleRad = targetAngleRad + (angleOffsetDeg * Math.PI / 180);
  console.log(`Mishit Result: Dist ${finalDistance.toFixed(0)} yds, Angle Offset ${angleOffsetDeg.toFixed(1)} deg`);

  const yardToDeg = 0.000009;
  const latOffset = finalDistance * yardToDeg * Math.sin(finalAngleRad);
  const lngOffset = finalDistance * yardToDeg * Math.cos(finalAngleRad);

  const endPos = {
    lat: startPos.lat + latOffset,
    lng: startPos.lng + lngOffset
  };

  const finalLandedLie = detectCollision(endPos, holeNumber);
  console.log(`Mishit landedLie after collision check: ${finalLandedLie}`);
  return { endPos: endPos, landedLie: finalLandedLie, penalty: (finalLandedLie === 'ob' || finalLandedLie === 'water') };
}

function getTDSQualityAndDeviation(tdsScore, maxTds) {
   const normalizedTds = Math.min(1, Math.max(0, tdsScore / (maxTds * 0.9)));
   let quality = 'Catastrophic';
   let angleDegRange = [-12, 12];
   let distPctRange = [-0.18, 0.18];

    if (tdsScore <= 15) { quality = 'Perfect'; angleDegRange = [-0.5, 0.5]; distPctRange = [-0.01, 0.01]; }
    else if (tdsScore <= 50) { quality = 'Great'; angleDegRange = [-1.5, 1.5]; distPctRange = [-0.03, 0.03]; }
    else if (tdsScore <= 100) { quality = 'Good'; angleDegRange = [-3, 3]; distPctRange = [-0.05, 0.05]; }
    else if (tdsScore <= 200) { quality = 'Fair'; angleDegRange = [-5, 5]; distPctRange = [-0.08, 0.08]; }
    else if (tdsScore <= 300) { quality = 'Poor'; angleDegRange = [-8, 8]; distPctRange = [-0.12, 0.12]; }

    const angleOffset = angleDegRange[0] + Math.random() * (angleDegRange[1] - angleDegRange[0]);
    const distFactor = 1.0 + (distPctRange[0] + Math.random() * (distPctRange[1] - distPctRange[0]));

  console.log(`TDS: ${tdsScore}/${maxTds} -> Quality: ${quality}, AngleDev: ${angleOffset.toFixed(1)}, DistFactor: ${distFactor.toFixed(3)}`);
  return { quality, angleOffsetDeg: angleOffset, distanceFactor: distFactor };
}

function calculatePutts(distanceYds, handicap) {
  const hcp = Math.max(0, Math.min(36, handicap));
  let currentDistYds = distanceYds;
  let puttsTaken = 0;
  const MAX_PUTTS = 5;

  console.log(`Putting Calc: Start Dist ${distanceYds.toFixed(1)} yds, HCP ${hcp}`);

  while (currentDistYds > 0.3 && puttsTaken < MAX_PUTTS) {
    puttsTaken++;
    let makeProb = 0.0;

    if (currentDistYds <= 1) makeProb = 0.98;
    else if (currentDistYds <= 2) makeProb = 0.80;
    else if (currentDistYds <= 3.3) makeProb = 0.55;
    else if (currentDistYds <= 5) makeProb = 0.35;
    else if (currentDistYds <= 8.3) makeProb = 0.18;
    else if (currentDistYds <= 15) makeProb = 0.08;
    else makeProb = 0.02;

    const reductionFactor = (hcp / 36) * (0.1 + 0.6 * (currentDistYds / 20));
    makeProb *= (1 - Math.min(0.9, reductionFactor));
    makeProb = Math.max(0.01, makeProb);

    const roll = Math.random();
    console.log(` Putt ${puttsTaken}: Dist ${currentDistYds.toFixed(1)} yds, MakeProb ${makeProb.toFixed(2)}, Rolled ${roll.toFixed(2)}`);

    if (roll < makeProb) {
      console.log("  -> Made!");
      currentDistYds = 0;
    } else {
      const leaveRatio = 0.1 + Math.random() * 0.2;
      const leaveDist = Math.max(0.33, currentDistYds * leaveRatio);
      console.log(`  -> Missed. Leave ${leaveDist.toFixed(1)} yds`);
      currentDistYds = leaveDist;
    }
  }
  const finalPutts = Math.min(puttsTaken, MAX_PUTTS);
  console.log(`Putting Calc Result: ${finalPutts} putts`);
  return finalPutts;
}

// --- Simplified OpenAI Response Parser --- (Commentary only)
function parseCommentary(responseString) {
    if (!responseString) return "Commentator is silent.";
    return responseString.replace(/```json\s*\{[\s\S]*\}\s*```/g, '').replace(/```/g, '').trim();
}

// --- NEW: Parse Initial LLM Response for Modifier --- //
function parsePlanModifiersResponse(responseString) {
    if (!responseString) return null;
    try {
        // Find the first '{' and last '}' to extract the JSON part
        const jsonStart = responseString.indexOf('{');
        const jsonEnd = responseString.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
            console.warn("parsePlanModifiersResponse: No valid JSON object found in string:", responseString);
            return null;
        }
        const jsonString = responseString.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);

        // Validate and extract the three expected numeric fields
        const executionDifficultyModifier = typeof data.executionDifficultyModifier === 'number' ? data.executionDifficultyModifier : 1.0;
        const distanceModifier = typeof data.distanceModifier === 'number' ? data.distanceModifier : 1.0;
        const directionModifierDegrees = typeof data.directionModifierDegrees === 'number' ? data.directionModifierDegrees : 0.0;

        // Add some basic clamping/validation
        const clampedExec = Math.max(0.5, Math.min(2.0, executionDifficultyModifier));
        const clampedDist = Math.max(0.05, Math.min(1.2, distanceModifier));
        const clampedDir = Math.max(-20.0, Math.min(20.0, directionModifierDegrees));

        return {
            executionDifficultyModifier: clampedExec,
            distanceModifier: clampedDist,
            directionModifierDegrees: clampedDir
        };
    } catch (error) {
        console.error("parsePlanModifiersResponse Error parsing JSON:", error, "Input:", responseString);
        return null; // Return null on error, defaults will be used
    }
}

// --- Helper to calculate Relative X/Y yards from Lat/Lng positions ---
function calculateRelativeAimYards(startPos, targetPos) {
  if (!startPos || !targetPos) return { x: 0, y: 0 };
  const distYards = distanceYards(startPos, targetPos);
  // Bearing calculation might need adjustment based on map projection / true north vs grid north
  // For simplicity, using the existing bearingBetween which calculates angle relative to East?
  // We want angle relative to North (Y-axis) for typical X/Y coords.
  // Let's use Math.atan2(dLng, dLat) for angle relative to North.
  const dLat = targetPos.lat - startPos.lat;
  const dLng = targetPos.lng - startPos.lng;
  const angleRadFromNorth = Math.atan2(dLng, dLat); 

  const x = distYards * Math.sin(angleRadFromNorth); // X is distance * sin(angle from North)
  const y = distYards * Math.cos(angleRadFromNorth); // Y is distance * cos(angle from North)
  return { x, y };
}

// --- NEW: Calculate 2D Ground Trace Path ---
function calculateGroundTracePoints(startPos, shotData, numPoints = TRACER_POINTS) {
  if (!startPos || !shotData?.landingPoint) return [];

  const points = [];
  const startLng = startPos.lng;
  const startLat = startPos.lat;
  // Assuming shotData.landingPoint is { x, y } in yards relative to start
  const relativeTargetYards = shotData.landingPoint;
  
  // Calculate target Lat/Lng based on relative yards
  // Use the existing calculatePointAtDistance, but need bearing first
  const bearingRad = Math.atan2(relativeTargetYards.x, relativeTargetYards.y); // Angle from North
  const distYards = Math.sqrt(relativeTargetYards.x**2 + relativeTargetYards.y**2);
  const targetPos = calculatePointAtDistance(startPos, bearingRad, distYards);
  
  const endLng = targetPos.lng;
  const endLat = targetPos.lat;

  // Simple linear interpolation for ground path for now
  // TODO: Could add curve based on shotData.curveMeters if needed
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lng = startLng + (endLng - startLng) * fraction;
    const lat = startLat + (endLat - startLat) * fraction;
    points.push([lng, lat]);
  }
  return points;
}

// --- NEW: Simple linear path between two coordinates (used for tracer to actual landing) ---
function buildLinearPath(startPos, endPos, numPoints = TRACER_POINTS) {
  if (!startPos || !endPos) return [];
  const points = [];
  const startLng = startPos.lng;
  const startLat = startPos.lat;
  const endLng = endPos.lng;
  const endLat = endPos.lat;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = startLng + (endLng - startLng) * t;
    const lat = startLat + (endLat - startLat) * t;
    points.push([lng, lat]);
  }
  return points;
}

// --- NEW: Calculate Target Map View ---
function calculateMapView(ballPos, pinPos) {
  if (!ballPos || !pinPos) {
    // Default view if positions are missing
    return { longitude: -121.948, latitude: 36.555, zoom: 15, pitch: 60, bearing: 0 };
  }

  const dist = distanceYards(ballPos, pinPos);
  
  // Calculate bearing from ball to pin (degrees from North)
  const dLng = pinPos.lng - ballPos.lng;
  const dLat = pinPos.lat - ballPos.lat;
  const angleRadFromNorth = Math.atan2(dLng, dLat);
  const bearingDeg = (angleRadFromNorth * 180 / Math.PI + 360) % 360;

  // Calculate zoom level based on distance (needs tuning)
  let zoom = 18 - Math.log2(Math.max(1, dist) / 50); // Example formula
  zoom = Math.max(14, Math.min(19, zoom)); // Clamp zoom level

  // Center the map slightly ahead of the ball towards the pin to keep the ball lower?
  // Or simply center on the ball and let the bearing handle the direction.
  // Let's center on the ball for now.
  const centerLng = ballPos.lng;
  const centerLat = ballPos.lat;

  return {
    center: [centerLng, centerLat],
    zoom: zoom,
    pitch: 60, // Maintain consistent pitch
    bearing: bearingDeg,
    duration: 1500, // Animation duration in ms
    essential: true // Ensures animation completes
  };
}


// --- Main Render --- //

function GolfGame({
    holeNumber,
    onHoleComplete,
    playerName,
    playerHandicap,
    playerGender,
    playerHandedness,
    threadId,
    aimMode,
    allScores // <<< Receive allScores prop
}) {
  // State Hooks
  const [viewState, setViewState] = useState({
    longitude: -121.948, // Default center (adjust as needed)
    latitude: 36.555,   // Default center
    zoom: 15,
    pitch: 60,
    bearing: 0
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [ballPosition, setBallPosition] = useState(null);
  const [currentHoleGeo, setCurrentHoleGeo] = useState(null);
  const [currentHoleMeta, setCurrentHoleMeta] = useState(null);
  const [pinPosition, setPinPosition] = useState(null); // Use green center as pin
  const [aimingLine, setAimingLine] = useState(null);
  const [trajectoryLine, setTrajectoryLine] = useState(null);
  const [club, setClub] = useState('7 Iron'); // Use club NAME string as key
  const [power, setPower] = useState(100);
  const [aimOffset, setAimOffset] = useState(0);
  const [messages, setMessages] = useState([]);
  const [score, setScore] = useState(0);
  const [shotNumber, setShotNumber] = useState(0);
  const [currentLie, setCurrentLie] = useState('tee');
  const [showHoleComplete, setShowHoleComplete] = useState(false);
  const [wind, setWind] = useState({ speed: 0, direction: 0 });
  const [shotDescription, setShotDescription] = useState('');
  const mapRef = useRef();
  const [activeTab, setActiveTab] = useState('controls');
  const [isHoleDataReady, setIsHoleDataReady] = useState(false);
  // Use computed interactionMode from aimMode prop
  const interactionMode = aimMode ? 'aim' : 'drag';
  const [targetPoint, setTargetPoint] = useState(null); // Stores {lng, lat} of map click
  const [isDraggingAim, setIsDraggingAim] = useState(false); // <<< NEW: Track mouse down for aiming
  // <<< NEW: State for SVG Overlay >>>
  const [ballScreenPos, setBallScreenPos] = useState({ x: 0, y: 0 });
  const [targetScreenPos, setTargetScreenPos] = useState(null); // <<< Renamed to rawTargetScreenPos
  const [clampedTargetScreenPos, setClampedTargetScreenPos] = useState(null); // <<< NEW: For drawing clamped line
  const [maxDistRadiusPx, setMaxDistRadiusPx] = useState(0);
  const [isAimingOverMax, setIsAimingOverMax] = useState(false); // <<< NEW: Track if aiming beyond max
  const [currentClampedDistance, setCurrentClampedDistance] = useState(0); // <<< NEW: Store clamped distance for overlay gradient
  // <<< NEW: State for Putting Modal >>>
  const [showPuttingModal, setShowPuttingModal] = useState(false);
  const [puttingResultData, setPuttingResultData] = useState(null); // { distToPin, putts, score, holeNum, par }
  const [isLoading, setIsLoading] = useState(false); // <<< ADD MISSING STATE DECLARATION
  // --- NEW Tracer State ---
  const [tracerPath, setTracerPath] = useState([]); // Full path points [lng, lat]
  const [tracerSourceData, setTracerSourceData] = useState({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }); // GeoJSON for Mapbox source
  const animationFrameRef = useRef(null);
  const animationStartTimeRef = useRef(null);
  // <<< NEW: State for Sidebar Tabs >>>
  const [activeSidebarTab, setActiveSidebarTab] = useState('shot'); // 'shot' or 'commentary'
  // <<< NEW: State to hold landing spot during animation >>>
  const [pendingEndPosition, setPendingEndPosition] = useState(null); 

  // --- Effects ---

  // <<< NEW: Log when component mounts >>>
  useEffect(() => {
    console.log("[GolfGame Mount Effect] Component Mounted");
  }, []); // Empty dependency array means this runs once on mount

  // Effect 1: Load hole data based on holeNumber prop
  useEffect(() => {
    console.log(`[Effect 1] Hole number changed to ${holeNumber}. Loading data...`);
    setIsHoleDataReady(false); // Reset flag
    setGameStarted(false); // Ensure game doesn't think it's started

    const geoData = PebbleData[holeNumber];
    const metaData = HoleMetadata[holeNumber];
    const teePosition = metaData?.tee || geoData?.teeCenter;
    const targetPinPosition = metaData?.pin || geoData?.greenCenter;

    if (metaData && teePosition && targetPinPosition) {
      setCurrentHoleGeo(geoData);
      setCurrentHoleMeta(metaData);
      setPinPosition(targetPinPosition);
      setBallPosition(teePosition);
      setAimingLine(null);
      setTrajectoryLine(null);
      setMessages([]); // Reset messages immediately
      setScore(0);
      setShotNumber(0);
      setCurrentLie('tee');
      setShowHoleComplete(false);

      // REMOVE direct setViewState call here
      // setViewState(prev => ({ ...prev, longitude: teePosition.lng, latitude: teePosition.lat, zoom: 16.5 }));
      
      const newWindSpeed = Math.random() * 15;
      const newWindDirection = Math.random() * 360;
      setWind({ speed: newWindSpeed, direction: newWindDirection });
      console.log(`[Effect 1] Hole ${holeNumber} data loaded. Wind: ${newWindSpeed.toFixed(1)}@${newWindDirection.toFixed(0)}°. Setting ready flag.`);
      setIsHoleDataReady(true); // <<< Set flag indicating data is ready

    } else {
      console.error(`[Effect 1] Data incomplete for hole ${holeNumber}`);
      // Handle error state appropriately
      setIsHoleDataReady(false);
      setMessages([{ type: 'announcer', text: `Error loading data for Hole ${holeNumber}.` }]);
    }
  }, [holeNumber]); // Depend only on holeNumber

  // Effect 2: Start the game *after* hole data is ready and threadId is available
  useEffect(() => {
    console.log(`[Effect 2] Checking conditions: isHoleDataReady=${isHoleDataReady}, threadId=${threadId}, gameStarted=${gameStarted}`);
    if (isHoleDataReady && threadId && !gameStarted) {
      console.log(`[Effect 2] Conditions met. Calling handleStart...`);
      handleStart();
    } else {
        if (!isHoleDataReady) console.log("[Effect 2] Waiting for hole data...");
        if (!threadId) console.log("[Effect 2] Waiting for threadId...");
        if (gameStarted) console.log("[Effect 2] Game already started.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHoleDataReady, threadId, gameStarted]); // Depend on data ready flag and threadId

  // Ensure targetPoint persists when switching modes
  useEffect(() => {
    // This effect only handles preserving state when changing modes
    // No cleanup needed
  }, [interactionMode]);

  // Recalculate aiming line AND power based on targetPoint
  useEffect(() => {
    if (ballPosition && targetPoint && mapRef.current) {
      const map = mapRef.current.getMap();
      if (!map) return; // Need map for projections

      const distanceToTarget = distanceYards(ballPosition, targetPoint);
      const maxClubDist = getMaxDistanceForClubAndLie(club, currentLie);

      // Clamp distance to max club distance
      const clampedDistanceYards = Math.min(distanceToTarget, maxClubDist);
      setCurrentClampedDistance(clampedDistanceYards); // <<< Store clamped distance

      // Calculate power percentage based on clamped distance
      // Clamp power between 1 and 100
      let calculatedPower = maxClubDist > 0 ? Math.round((clampedDistanceYards / maxClubDist) * 100) : 0;
      calculatedPower = Math.max(1, Math.min(100, calculatedPower));
      setPower(calculatedPower);

      // Calculate the angle towards the target point
      const bearingToTarget = bearingBetween(ballPosition, targetPoint);

      // Calculate the *coordinates* of the clamped endpoint
      const clampedEndCoords = calculatePointAtDistance(ballPosition, bearingToTarget, clampedDistanceYards);
      
      // Project the clamped coordinates to screen position for drawing
      const newClampedTargetScreenPos = map.project([clampedEndCoords.lng, clampedEndCoords.lat]);
      setClampedTargetScreenPos(newClampedTargetScreenPos);

      // Always update the raw target screen position too (for reference)
      const newTargetScreenPos = map.project([targetPoint.lng, targetPoint.lat]);
      setTargetScreenPos(newTargetScreenPos);

      // Calculate screen radius for the max distance arc
      const pointAtMaxDist = calculatePointAtDistance(ballPosition, bearingToTarget, maxClubDist);
      const maxDistScreenPos = map.project([pointAtMaxDist.lng, pointAtMaxDist.lat]);
      const currentBallScreenPos = map.project([ballPosition.lng, ballPosition.lat]); // Get current ball screen pos
      const radiusPx = Math.sqrt(Math.pow(maxDistScreenPos.x - currentBallScreenPos.x, 2) + Math.pow(maxDistScreenPos.y - currentBallScreenPos.y, 2));
      setMaxDistRadiusPx(radiusPx);

      // Calculate if aiming beyond max distance
      setIsAimingOverMax(distanceToTarget > maxClubDist);

      // Clear the old aimingLine state (no longer used for drawing)
      setAimingLine(null); 

    } else {
      // Don't clear clamped position even if targetPoint is null
      // We want to preserve the aiming line when toggling modes
      setMaxDistRadiusPx(0);
      setPower(100); 
      setCurrentClampedDistance(0); // <<< Reset clamped distance
    }
  // Update dependencies
  }, [ballPosition, targetPoint, club, currentLie, mapRef, viewState]);

  // <<< NEW: Update screen positions on map move >>>
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (ballPosition) {
        const newBallScreenPos = map.project([ballPosition.lng, ballPosition.lat]);
        setBallScreenPos(newBallScreenPos);

        // Update raw target screen pos if target exists
        if (targetPoint) {
          const newTargetScreenPos = map.project([targetPoint.lng, targetPoint.lat]);
          setTargetScreenPos(newTargetScreenPos); // Update raw pos
        }
      }
    }
  }, [ballPosition, targetPoint, club, currentLie, pinPosition, viewState]);

  // --- NEW Effect for Tracer Animation (Corrected Structure) ---
  useEffect(() => {
    // Condition to exit: No path to animate OR no pending end position exists.
    if (tracerPath.length === 0 || !pendingEndPosition) {
      // If animation was in progress, cancel it.
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Special case: If animation just finished (path cleared) but we still have pending pos,
      // ensure the ball position gets updated.
      if (pendingEndPosition && tracerPath.length === 0) {
        console.log("[Tracer Cleanup] Setting final ball position from pending (after animation finished):", pendingEndPosition);
        setBallPosition(pendingEndPosition);
        setPendingEndPosition(null);
      }
      return; // Exit the effect
    }

    // --- Start Animation --- 
    console.log("[Tracer Animation] Starting animation for path:", tracerPath);
    animationStartTimeRef.current = performance.now();
    animationFrameRef.current = null; 

    const animate = (currentTime) => {
      const elapsedTime = currentTime - animationStartTimeRef.current;
      const progress = Math.min(1, elapsedTime / TRACER_DURATION_MS);
      const pointsToShow = Math.floor(progress * (tracerPath.length - 1)) + 1;
      const currentCoords = tracerPath.slice(0, pointsToShow);

      // Update the map source data for the line layer
      setTracerSourceData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: currentCoords }
      });

      // Check if animation should continue
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // --- Animation Complete --- 
        console.log("[Tracer Animation] Animation complete. Setting final ball position and clearing path.");
        animationFrameRef.current = null;
        
        // Set the actual ball position using the stored pending position
        setBallPosition(pendingEndPosition);
        
        // Clear the tracer path and the pending position state AFTER a short delay
        setTimeout(() => {
            setTracerPath([]);
            setPendingEndPosition(null);
            console.log("[Tracer Animation] Path and Pending Position cleared after delay.");
        }, 100); // 100ms delay
      }
    }; // End of animate function definition

    // Initiate the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    // --- Cleanup Function --- 
    // This runs if the component unmounts OR if dependencies change mid-animation
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        console.log("[Tracer Animation] Animation cancelled on cleanup.");
        // If cancelled, immediately move the ball to the pending position 
        // to avoid it being stuck at the start.
        if (pendingEndPosition) {
          console.log("[Tracer Cleanup] Setting final ball position from pending (on cancel):");
          setBallPosition(pendingEndPosition);
          setPendingEndPosition(null);
        }
      }
    }; // End of cleanup function definition

  // Dependencies: Re-run effect if the path or pending position changes.  
  }, [tracerPath, pendingEndPosition]);

  // --- NEW Effect 6: Update Map Camera View ---
  useEffect(() => {
    if (mapRef.current && ballPosition && pinPosition && isHoleDataReady) {
      const map = mapRef.current.getMap();
      if (map) {
        console.log("[Effect 6] Ball/Pin position changed or hole ready. Calculating new map view.");
        const targetView = calculateMapView(ballPosition, pinPosition);
        console.log("[Effect 6] Flying to target view:", targetView);
        map.flyTo({
          center: [ballPosition.lng, ballPosition.lat],
          zoom: Math.max(15, Math.min(18, targetView.zoom)),
          pitch: 60,
          bearing: targetView.bearing,
          duration: 1500
        });
      } else {
        console.warn("[Effect 6] Map object not available yet.");
      }
    } else {
        if (!mapRef.current) console.log("[Effect 6] Waiting for map ref...");
        if (!ballPosition) console.log("[Effect 6] Waiting for ball position...");
        if (!pinPosition) console.log("[Effect 6] Waiting for pin position...");
        if (!isHoleDataReady) console.log("[Effect 6] Waiting for hole data ready flag...");
    }
  }, [ballPosition, pinPosition, isHoleDataReady]); // Depend on ball/pin position and data ready flag

  // --- Game Logic Functions ---

  function handleStart() {
    // Check should ideally be redundant now due to Effect 2, but keep as safeguard
    if (!isHoleDataReady || !threadId || !currentHoleMeta || !ballPosition || !pinPosition) {
        console.error("handleStart called prematurely. Missing dependencies:", 
            { isHoleDataReady, threadId, currentHoleMeta, ballPosition, pinPosition });
        return; 
    }
    console.log(`handleStart: Starting game for hole ${holeNumber} with thread ${threadId}`);
    setCurrentLie('tee');
    setScore(0);
    setShotNumber(1);

    const introMessages = [
        // Use a generic welcome, commentary is now separate
        { type: 'announcer', text: `Welcome ${playerName} to Hole ${holeNumber} (Par ${currentHoleMeta.par}, ${currentHoleMeta.yards} yds).` },
        { type: 'announcer', text: `Wind: ${wind.speed.toFixed(1)} mph @ ${wind.direction.toFixed(0)}°.` },
        { type: 'announcer', text: `Tee shot. ${distanceYards(ballPosition, pinPosition).toFixed(0)} yds to pin.` }
    ];
    setMessages(introMessages);
    setGameStarted(true);
    setShowHoleComplete(false);
    setTrajectoryLine(null);

    // Thread creation is handled in App.js
  }

  function handleReplayHole() {
    console.log("Replaying hole...");
    const currentHoleNum = holeNumber;
    setCurrentHoleGeo(null);
    setTimeout(() => {
      const geoData = PebbleData[currentHoleNum];
      const metaData = HoleMetadata[currentHoleNum];
       if (geoData && metaData && geoData.teeCenter && geoData.greenCenter) {
         setCurrentHoleGeo(geoData);
       } else {
            console.error(`Failed to reload data for hole ${currentHoleNum}`);
       }
    }, 0);
  }

  function addAnnouncer(txt) {
    setMessages(prev => [...prev, { type: 'announcer', text: txt }]);
  }
  function addUser(txt) {
    setMessages(prev => [...prev, { type: 'user', text: txt }]);
  }

  function animateBall(start, end, duration = 1000) {
    return new Promise((resolve) => {
        setTrajectoryLine({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[start.lng, start.lat], [end.lng, end.lat]] } });
        setBallPosition(end);
        setTimeout(() => {
            setTrajectoryLine(null);
            resolve();
        }, duration);
     });
}

  function calculateLandingSpot(start, target, params) {
    const {
        club,
        power,
        targetPoint,
        lie,
        wind,
        handicap,
        holeNumber,
        executionDifficultyModifier = 1.0,
        distanceModifier = 1.0,
        directionModifierDegrees = 0.0
    } = params;

    console.log("Calculating Landing Spot with Modifiers:", { club, power, targetPoint, lie, wind, handicap, holeNumber, executionDifficultyModifier, distanceModifier, directionModifierDegrees });

    const mishitDetails = calculateMishit(handicap);
    const { isMishit, mishitType, quality } = mishitDetails;

    let targetAngleRad = bearingBetween(start, targetPoint);
    console.log(`${params.shotId || '[Calc]'} Initial Target Angle (to Click Point): ${(targetAngleRad * 180 / Math.PI).toFixed(1)}°`);

    const directionModifierRad = directionModifierDegrees * Math.PI / 180;
    targetAngleRad += directionModifierRad;
    console.log(`${params.shotId || '[Calc]'} Applied LLM Direction Modifier: ${directionModifierDegrees.toFixed(1)}deg. New Target Angle (Pre-Wind): ${(targetAngleRad * 180 / Math.PI).toFixed(1)}°`);

    if (isMishit && (mishitType === 'shank_ob' || mishitType === 'top_water')) {
        const { penaltyPos, penalty } = calculateMishitOutcome(mishitType, start, 0, targetAngleRad, holeNumber);
        console.log(`${params.shotId || '[Calc]'} Mishit Outcome (OB/Water):`, { endPos: penaltyPos, landedLie: penalty, penalty: 1, quality, isMishit, mishitType });
        return { endPos: penaltyPos, landedLie: penalty, penalty: 1, quality, isMishit, mishitType };
    }

    const maxClubDist = getMaxDistanceForClubAndLie(club, lie);
    let intendedDist = maxClubDist * (power / 100);

    intendedDist *= distanceModifier;
    console.log(`${params.shotId || '[Calc]'} Applied LLM Distance Modifier: ${distanceModifier.toFixed(2)}x. Intended Distance (Pre-Variability): ${intendedDist.toFixed(1)} yds`);

    // <<< CORRECTED Mishit Distance Penalties >>>
    if (isMishit) {
      switch (mishitType) {
        case 'duff': intendedDist *= (0.05 + Math.random() * 0.15); break; // 5-20%
        case 'chunk': intendedDist *= (0.2 + Math.random() * 0.3); break; // 20-50%
        case 'top': intendedDist *= (0.4 + Math.random() * 0.4); break; // 40-80%
        case 'shank': intendedDist *= (0.3 + Math.random() * 0.3); break; // 30-60% (Shanks can still go a bit)
        default: break;
      }
      console.log(`${params.shotId || '[Calc]'} Applied Mishit (${mishitType}) Penalty. New Intended Distance: ${intendedDist.toFixed(1)} yds`);
    }
    // if (isMishit && mishitType === 'chunk') intendedDist *= 0.5;
    // if (isMishit && mishitType === 'thin') intendedDist *= 0.8; // Removed 'thin'

    const baseVariabilityFactor = 0.15;
    const handicapVariabilityFactor = (handicap / 36) * 0.15;
    const effectiveVariability = (baseVariabilityFactor + handicapVariabilityFactor) * executionDifficultyModifier;

    const distanceVariability = intendedDist * effectiveVariability * (Math.random() * 2 - 1);
    let actualDist = intendedDist + distanceVariability;

    const angleVariabilityDeg = 15 * effectiveVariability * (Math.random() * 2 - 1);
    const angleVariabilityRad = angleVariabilityDeg * Math.PI / 180;
    let actualAngleRad = targetAngleRad + angleVariabilityRad;

    console.log(`${params.shotId || '[Calc]'} Applied Execution Variability: Dist Var=${distanceVariability.toFixed(1)} yds, Angle Var=${angleVariabilityDeg.toFixed(1)}deg`);

    const windSpeedYdsPerSec = wind.speed * 1.76;
    const windAngleRad = wind.direction * Math.PI / 180;
    const flightTimeEstimate = Math.sqrt(actualDist / 5);

    const windEffectX = Math.cos(windAngleRad) * windSpeedYdsPerSec * flightTimeEstimate;
    const windEffectY = Math.sin(windAngleRad) * windSpeedYdsPerSec * flightTimeEstimate;

    const shotVectorX = Math.cos(actualAngleRad) * actualDist;
    const shotVectorY = Math.sin(actualAngleRad) * actualDist;

    const finalVectorX = shotVectorX + windEffectX;
    const finalVectorY = shotVectorY + windEffectY;

    const finalDistance = Math.sqrt(finalVectorX ** 2 + finalVectorY ** 2);
    const finalAngleRad = Math.atan2(finalVectorY, finalVectorX);

    const finalClampedDistance = Math.max(1, finalDistance);
    console.log(`${params.shotId || '[Calc]'} Applied Wind: Final Dist=${finalClampedDistance.toFixed(1)} yds, Final Angle=${(finalAngleRad * 180 / Math.PI).toFixed(1)}°`);

    const startLatRad = start.lat * Math.PI / 180;
    const startLngRad = start.lng * Math.PI / 180;
    const R = 6371e3;
    const finalDistMeters = finalClampedDistance / 1.09361;

    const endLatRad = Math.asin(Math.sin(startLatRad) * Math.cos(finalDistMeters / R) +
                           Math.cos(startLatRad) * Math.sin(finalDistMeters / R) * Math.sin(finalAngleRad));

    const endLngRad = startLngRad + Math.atan2(Math.cos(finalAngleRad) * Math.sin(finalDistMeters / R) * Math.cos(startLatRad),
                                      Math.cos(finalDistMeters / R) - Math.sin(startLatRad) * Math.sin(endLatRad));

    let endPos = {
        lat: endLatRad * 180 / Math.PI,
        lng: endLngRad * 180 / Math.PI
    };

    let landedLie = detectCollision(endPos, holeNumber);
    let penalty = 0;

    if (landedLie === 'ob') {
        console.log(`${params.shotId || '[Calc]'} Initial landing OB. Calculating entry point...`);
        const entryPoint = findOBEntryPoint(start, endPos, holeNumber);
        endPos = entryPoint;
        landedLie = detectCollision(endPos, holeNumber) || 'rough';
        penalty = 1;
        console.log(`${params.shotId || '[Calc]'} OB Penalty Applied. New Position:`, endPos, "New Lie:", landedLie);
    }

    console.log(`${params.shotId || '[Calc]'} Final Landing Spot:`, { endPos, landedLie, penalty, quality, isMishit, mishitType });
    return { endPos, landedLie, penalty, quality, isMishit, mishitType };
  }

  function getMaxDistanceForClubAndLie(clubName, lie) {
    const base = CLUB_BASE_DISTANCE[clubName] || 0;
    const mult = LIE_MULTIPLIER[lie] || 1.0;
    return Math.round(base * mult);
  }

  async function handleTakeShot() {
    console.log("handleTakeShot triggered");
    if (!ballPosition || !targetPoint || !threadId || !currentHoleMeta) {
      console.error("Missing required data for taking shot:", { ballPosition, targetPoint, threadId, currentHoleMeta });
      addAnnouncer("Cannot take shot. Missing required data.");
      return;
    }

    const shotId = `H${holeNumber}S${shotNumber + 1}`;
    console.log(`${shotId} - Initiating shot...`);

    addUser(`Takes shot ${shotNumber + 1} with ${club}...`);
    setTracerPath([]); // <<< Clear previous tracer path
    setTracerSourceData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }}); // Clear map source

    setIsLoading(true);
    setShotDescription('');

    // --- 1. Prepare Context for LLM Plan (Actual Game Logic) ---
    const contextForPlanning = `
      # Golf Shot Planning Context - ${shotId}
      # Player Profile
      Name: ${playerName}
      Handicap: ${playerHandicap}
      Gender: ${playerGender}
      Handedness: ${playerHandedness}

      # Course & Hole
      Course: Pebble Beach Golf Links
      Hole: ${holeNumber}
      Par: ${currentHoleMeta.par}
      Yardage: ${currentHoleMeta.yards}
      Description: ${holeDescriptions[holeNumber] || 'No description available.'}

      # Current Game State
      Shot Number: ${shotNumber + 1}
      Current Score Relative to Par: ${score - currentHoleMeta.par * (shotNumber > 0 ? 1 : 0)} [Needs review]
      Wind: ${wind.speed.toFixed(1)} mph from ${wind.direction.toFixed(0)} degrees
      Ball Position: ${currentLie} (Lat: ${ballPosition.lat.toFixed(6)}, Lng: ${ballPosition.lng.toFixed(6)})
      Distance to Pin: ${distanceYards(ballPosition, pinPosition).toFixed(1)} yards

      # Planned Shot
      Selected Club: ${club}
      Intended Target Coordinates: Lat: ${targetPoint.lat.toFixed(6)}, Lng: ${targetPoint.lng.toFixed(6)}
      Distance to Target Point: ${distanceYards(ballPosition, targetPoint).toFixed(1)} yards
      Power Setting: ${power.toFixed(0)}%

      # Task
      Analyze the player's plan. Provide three numeric modifiers based on the plan's quality and the situation's difficulty. Factors to consider: club choice appropriateness, target selection (risk/reward), current lie penalty, wind impact, distance to hole, terrain hazards near target.
      Output ONLY a JSON object with these exact keys and numeric values:
      {
        "executionDifficultyModifier": number, // (0.5=Easy -> 1.0=Standard -> 2.0=Very Hard) - How hard is this specific shot to execute well given lie, distance, wind, hazards?
        "distanceModifier": number, // (e.g., 0.9=Slightly less distance expected, 1.0=Standard, 1.1=Slightly more) - Adjust expected distance based on factors like wind help/hurt, uphill/downhill (if known), suboptimal club choice.
        "directionModifierDegrees": number // (e.g., -5.0=Expect shot to start left, 0.0=Straight, 5.0=Expect shot to start right) - Adjust initial direction based on strong crosswind, sidehill lie (if known), strategic aim adjustments.
      }
    `.trim();

    // --- 2. Request Plan Modifiers from LLM (Actual Game Logic) ---
    let planModifiers = { executionDifficultyModifier: 1.0, distanceModifier: 1.0, directionModifierDegrees: 0.0 }; // Defaults
    try {
      console.log(`${shotId} - Requesting Plan Modifiers from LLM...`);
      // Correct Sequence: Message -> Run -> Fetch
      await createThreadMessage(threadId, 'user', contextForPlanning);
      await createRun(threadId);
      const modifierResponse = await fetchAssistantMessage(threadId);
      // --- End Correct Sequence ---
      console.log(`${shotId} - Received Modifier Response:`, modifierResponse);
      const parsedModifiers = parsePlanModifiersResponse(modifierResponse);
      if (parsedModifiers) {
        planModifiers = parsedModifiers;
        console.log(`${shotId} - Parsed Modifiers:`, planModifiers);
      } else {
        console.warn(`${shotId} - Failed to parse modifiers, using defaults.`);
        addAnnouncer("(Could not analyze plan, using standard shot calculation)");
      }
    } catch (error) {
      console.error(`${shotId} - Error fetching plan modifiers:`, error);
      addAnnouncer("Error analyzing shot plan.");
      // Continue with default modifiers
    }

    // --- 3. Calculate ACTUAL Landing Spot (Actual Game Logic) ---
    const landingParams = {
      shotId,
      club,
      power,
      targetPoint,
      lie: currentLie,
      wind,
      handicap: playerHandicap,
      holeNumber,
      ...planModifiers // Spread the received/default modifiers
    };
    console.log(`${shotId} - DEBUG: Params for calculateLandingSpot`, landingParams);
    const { endPos, landedLie, penalty, quality, isMishit, mishitType } = calculateLandingSpot(ballPosition, targetPoint, landingParams);
    console.log(`${shotId} - DEBUG: Result from calculateLandingSpot`, { endPos, landedLie, penalty, quality, isMishit, mishitType });

    // --- Build tracer path to the actual computed landing position ---
    const actualGroundPath = buildLinearPath(ballPosition, endPos, TRACER_POINTS);
    if (actualGroundPath.length > 1) {
      setTracerPath(actualGroundPath);
    }

    // --- 4. Handle Penalties (Done within calculateLandingSpot for OB/Water) --- 
    let currentShotScore = 1 + penalty;

    // --- 5. Calculate Putts if on Green ---
    let putts_taken = 0;
    let isHoleFinishedOnGreen = false;
    if (landedLie === 'green') {
      const distToPinYds = distanceYards(endPos, pinPosition);
      putts_taken = calculatePutts(distToPinYds, playerHandicap);
      currentShotScore += putts_taken;
      isHoleFinishedOnGreen = true;
      console.log(`${shotId} - Landed on green. Calculated ${putts_taken} putts.`);
    } else {
      console.log(`${shotId} - Landed in ${landedLie}. No putting calculation.`);
    }

    // --- 6. Request Outcome Commentary from LLM ---
    const newTotalScore = score + currentShotScore;
    let outcomeCommentary = "..."; // Default commentary
    let commentaryContext = null; // Initialize context for logging
    try {
      console.log(`${shotId} - Requesting Outcome Commentary...`);
      // Build context string first for logging
      commentaryContext = `
        Provide commentary for the outcome of a golf shot in the style of Mike Tirico.

        Player Profile:
        - Name: ${playerName}
        - Handicap: ${playerHandicap}
        - Gender: ${playerGender}
        - Handedness: ${playerHandedness}

        Shot Context:
        - Hole: ${holeNumber} (Par ${currentHoleMeta.par}, ${currentHoleMeta.yards} yards)
        - Hole Layout/Strategy: ${holeDescriptions[holeNumber] || "No description available."}
        - Player's Stated Plan: "${shotDescription || 'Standard Shot'}"
        - Execution Difficulty Mod Applied: ${planModifiers.executionDifficultyModifier.toFixed(2)}
        - Distance Mod Applied: ${planModifiers.distanceModifier.toFixed(2)}
        - Direction Mod Applied: ${planModifiers.directionModifierDegrees.toFixed(1)} degrees
        - Shot Number Taken: ${shotNumber} // Use shot number *before* incrementing        - Inputs: Club=${club}, Power=${power}%, AimOffset=${aimOffset}°, StartingLie=${currentLie} // Use currentLie *before* changing        - Conditions: Wind=${wind.speed.toFixed(1)}mph @ ${wind.direction.toFixed(0)}°

        Actual Outcome:
        - Mishit Occurred: ${isMishit ? `Yes (Type: ${mishitType})` : 'No'}
        - Shot Quality: ${quality}
        - Landing Lie: ${landedLie === 'in_hole' ? 'Green' : landedLie} ${penalty ? '(Penalty Drop)' : ''} // Report Green if ended in hole
        - Penalty Strokes: ${penalty ? 1 : 0}
        - Putts Taken (if applicable): ${putts_taken}
        - Strokes Added This Turn: ${currentShotScore}
        - Dist To Pin After: ${distanceYards(endPos, pinPosition).toFixed(1)} yards // Calculate distance from NEW position        - Final Lie: ${landedLie}
        - Current Total Score: ${newTotalScore}
        - Hole Completed This Turn: ${isHoleFinishedOnGreen}

        Task: Generate engaging commentary (1-2 sentences). Focus on the narrative vs the plan/hole layout. Do NOT mention modifiers, mechanics, dice, or TDS.
        `.trim();
      console.log(`${shotId} - DEBUG: Context Sent for Outcome Commentary`, commentaryContext);
      
      // Call the refactored helper function
      outcomeCommentary = await requestOutcomeCommentary(
        shotId,
        commentaryContext // Pass the constructed context
      );
      
      console.log(`${shotId} - DEBUG: Received Outcome Commentary:`, outcomeCommentary);
    } catch (error) {
      console.error(`${shotId} - Error fetching outcome commentary:`, error);
      addAnnouncer(`(Commentary system error: ${error.message})`);
    }

    // --- 7. Update Game State ---
    console.log(`${shotId} - DEBUG: Updating State:`, { score: newTotalScore, shotNumber: shotNumber + 1 + penalty, currentLie: landedLie });
    setScore(newTotalScore);
    setShotNumber(prev => prev + 1 + penalty); // Increment shot number by 1 + penalty strokes
    setCurrentLie(landedLie);
    console.log(`${shotId} - DEBUG: Setting PENDING end position to:`, endPos);
    setPendingEndPosition(endPos); // <<< Set PENDING position first
    // console.log(`${shotId} - DEBUG: Setting ballPosition to:`, endPos); // <<< REMOVE immediate update
    // setBallPosition(endPos); // <<< REMOVE immediate update
    setTargetPoint(null); // Reset target point after shot
    setClampedTargetScreenPos(null); // Reset visual target line
    setMaxDistRadiusPx(0);
    setCurrentClampedDistance(0);

    // --- 8. Animate Ball (Marker Move) - The tracer is separate ---
    // The tracer animation runs based on tracerPath state.
    // The ball marker position updates instantly via setBallPosition above.

    // --- 9. Check for Hole Completion ---
    if (isHoleFinishedOnGreen) {
      console.log(`${shotId} - Hole finished on green. Score: ${newTotalScore}`);
      addAnnouncer(`Hole ${holeNumber} complete! Score: ${newTotalScore} (${newTotalScore - currentHoleMeta.par >= 0 ? '+' : ''}${newTotalScore - currentHoleMeta.par})`);
      setPuttingResultData({ holeNum: holeNumber, par: currentHoleMeta.par, score: newTotalScore, putts: putts_taken, distToPin: distanceYards(endPos, pinPosition) });
      setShowPuttingModal(true);
      onHoleComplete(holeNumber, newTotalScore); // Notify App
      // Don't setShowHoleComplete(true); use modal instead
    } else if (landedLie === 'ob' || landedLie === 'water') {
        // Already handled commentary and score/shot update. Ball position is updated.
        // Player needs to take their next shot (now shotNumber + 1 + penalty) from previous spot or designated drop area.
        // For simplicity now, we'll just let them shoot from the new (penalty) position.
        // TODO: Implement proper drop logic if needed.
         addAnnouncer(`Penalty assessed. Taking shot ${shotNumber + 1 + penalty} from ${landedLie === 'ob' ? 'out of bounds' : 'water hazard vicinity'}.`);
    }

    setIsLoading(false); // Now this should be defined
    console.log(`${shotId} - Shot processing complete.`);
  }

  // <<< NEW Helper Function for requesting commentary >>>
  async function requestOutcomeCommentary(shotId, commentaryContext) { 
    if (!threadId) return "(Thread ID missing)"; 

    try {
      await createThreadMessage(threadId, 'user', commentaryContext);
      await createRun(threadId);
      const assistantResponseText = await fetchAssistantMessage(threadId);
      const commentary = parseCommentary(assistantResponseText); 
      addAnnouncer(`Outcome: ${commentary}`); 
      return commentary; // Return parsed commentary for logging
    } catch (error) {
      console.error(`${shotId} Error getting outcome commentary inside helper:`, error);
      addAnnouncer(`(Commentary system error: ${error.message})`);
      return `(Error: ${error.message})`; // Return error message for logging
    }
  }

  // <<< NEW Handler for Proceed Button >>>
  function handleProceedToNextTee() {
    if (!puttingResultData) return;

    const { holeNum, score: finalScore } = puttingResultData;
    
    console.log(`Proceeding from Hole ${holeNum}. Final Score: ${finalScore}`);
    setScore(finalScore); // Set the final score now
    onHoleComplete(holeNum, finalScore); // Notify App
    setShowPuttingModal(false); // Hide modal
    setPuttingResultData(null); // Clear data
    setTargetPoint(null); // Clear aiming target for next hole

    // Logic to advance to the next hole (or finish round)
    if (holeNum < 18) {
        // Get the next hole's tee position
        const nextHoleNum = holeNum + 1;
        const nextHoleMeta = HoleMetadata[nextHoleNum];
        
        if (nextHoleMeta && nextHoleMeta.tee) {
            // Use the modern viewState transition approach
            setViewState({
                longitude: nextHoleMeta.tee.lng,
                latitude: nextHoleMeta.tee.lat,
                zoom: 16.5,
                pitch: 60,
                bearing: 0,
                transitionDuration: 2000, // 2 second smooth transition
            });
        }
        
        addAnnouncer(`Moving to Hole ${nextHoleNum}...`);
    } else {
        addAnnouncer(`Round complete! Score for hole 18: ${finalScore}. Check scorecard for total.`); 
    }
  }

  // --- Rendering Functions ---

  // --- Main Render --- //

  if (!isHoleDataReady) {
       return <div style={modernStyles.container}>Loading Hole {holeNumber}...</div>;  }

  if (!currentHoleGeo || !currentHoleMeta) {
    return <div style={modernStyles.container}>Loading hole data or data missing...</div>;
  }

  // --- Tab Button Styles (Inline for now) ---
  const tabButtonStyle = {
    padding: '10px 15px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: '500',
    color: '#888',
    borderBottom: '2px solid transparent',
    marginRight: '10px',
  };

  const activeTabButtonStyle = {
    ...tabButtonStyle,
    color: '#333',
    borderBottom: '2px solid #34d399',
  };

  // --- UI Rendering ---
  // Removed duplicate renderPolygons declaration

  // Add the renderPolygons function here
  const renderPolygons = (geoData, type, color, opacity = 0.5) => {
    if (!geoData || !geoData[type] || !Array.isArray(geoData[type])) return null;

    const features = geoData[type].map((geom, index) => ({
      type: "Feature",
      geometry: geom, // Assuming geom is already a valid GeoJSON geometry object
      properties: { id: `${type}-${holeNumber}-${index}` }
    }));

    if (features.length === 0) return null;

    return (
      <Source
        id={`${type}-source-${holeNumber}`}
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: features
        }}
      >
        <Layer
          id={`${type}-layer-${holeNumber}`}
          type="fill"
          paint={{
            "fill-color": color,
            "fill-opacity": opacity
          }}
        />
      </Source>
    );
  };

  // Calculate total round score relative to par
  const calculateTotalScore = () => {
    let totalScore = 0;
    let totalPar = 0;
    for (let i = 1; i < holeNumber; i++) { // Only count completed holes
      if (allScores[i] !== null && HoleMetadata[i]) {
        totalScore += allScores[i];
        totalPar += HoleMetadata[i].par;
      }
    }
    // Add current hole score if it's in progress (using state)
    // NOTE: We want the score *before* the current hole is finished
    // So we use the scores from `allScores` up to the previous hole.
    
    return totalScore - totalPar;
  };

  const totalRoundScoreRelativeToPar = calculateTotalScore();

  return (
    <div style={modernStyles.container}>
      {isLoading && <div style={modernStyles.loadingOverlay}>Processing Shot...</div>}

      {/* Sidebar - Correctly structured based on flex column layout */}
      <div style={modernStyles.sidebar}>
        {/* Scoreboard Section (Always Visible) */}        <div style={modernStyles.scoreboard}>
          <div style={modernStyles.scoreHeader}>
            <h3>Hole {holeNumber} (Par {currentHoleMeta?.par || 'N/A'})</h3>
            <p>{playerName} | Shot {shotNumber} | Score: {score}</p>
          </div>
          {/* Removed Shot Info/Club from here - moved to Shot Tab */}
        </div>

        {/* Tab Controls */}
        <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab}>
          <TabsList className="sidebar-tabs">
            <TabsTrigger value="shot" className={`sidebar-tab-button ${activeSidebarTab === 'shot' ? 'active' : ''}`}>
              Shot Setup
            </TabsTrigger>
            <TabsTrigger value="commentary" className={`sidebar-tab-button ${activeSidebarTab === 'commentary' ? 'active' : ''}`}>
              Commentary
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content Area - Takes remaining space */}        <div className="sidebar-tab-content">
          {/* Shot Selection Tab Content */}          {activeSidebarTab === 'shot' && (
            <div className="shot-selection-content"> 
              {/* Put Shot Info, Club Select, Describe, Button here */}              <div style={modernStyles.shotInfo}> {/* Use existing styles */}                <p>Current Lie: {currentLie}</p>
                <p>Distance to Pin: {ballPosition && pinPosition ? distanceYards(ballPosition, pinPosition).toFixed(0) : 'N/A'} yds</p>
                <p>Wind: {wind.speed.toFixed(1)} mph @ {wind.direction.toFixed(0)}°</p>
              </div>
              <div style={modernStyles.clubSelector}>
                <Label htmlFor="club-select">Club</Label>
                <Select value={club} onValueChange={(val) => setClub(val)}>
                  <SelectTrigger id="club-select" aria-label="Select club">
                    <SelectValue placeholder="Select club" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CLUB_BASE_DISTANCE).map((clubName) => (
                      <SelectItem key={clubName} value={clubName}>{clubName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ margin: '15px 0' }}>
                <Label htmlFor="shot-description">Think through your shot</Label>
                <Input
                  id="shot-description"
                  value={shotDescription}
                  onChange={(e) => setShotDescription(e.target.value)}
                  placeholder="Describe your plan and how you intend to execute it"
                />
              </div>
              <Button 
                onClick={handleTakeShot}
                disabled={!targetPoint || !ballPosition || isLoading}
              >
                {isLoading ? 'Processing...' : 'Take Shot'}
              </Button>
            </div>
          )}

          {/* Commentary Tab Content */}          {activeSidebarTab === 'commentary' && (
            <div style={modernStyles.messageContainer} className="commentary-content"> {/* Use existing style */}              {messages.map((msg, i) => (
                <div key={i} style={msg.type === 'announcer' ? modernStyles.announcer : modernStyles.user}>
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div style={modernStyles.mapArea}
        className={interactionMode === 'aim' ? 'map-aim-mode' : ''}
        onMouseDown={(e) => {
          if (interactionMode === 'aim' && ballPosition) {
            setIsDraggingAim(true);
          }
        }}
        onMouseUp={(e) => {
          setIsDraggingAim(false);
        }}
        onMouseLeave={(e) => {
          setIsDraggingAim(false);
        }}
        onMouseMove={(e) => {
          if (isDraggingAim && interactionMode === 'aim' && mapRef.current && ballPosition) {
            const map = mapRef.current.getMap();
            const canvas = map.getCanvas();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const lngLat = map.unproject([x, y]);
            setTargetPoint(lngLat);
            setTargetScreenPos({x, y});
            
            // Calculate distance to check if over max
            const distToTarget = distanceYards(ballPosition, lngLat);
            const maxDist = getMaxDistanceForClubAndLie(club, currentLie);
            setIsAimingOverMax(distToTarget > maxDist);
          }
        }}
      >
        {/* <<< Add Player Info Box Here >>> */}
        {isHoleDataReady && (
          <PlayerInfoBox 
            playerName={playerName}
            holeNumber={holeNumber}
            holePar={currentHoleMeta?.par || 0} 
            holeYards={currentHoleMeta?.yards || 0} 
            shotNumber={shotNumber}
            currentScore={totalRoundScoreRelativeToPar} // <<< Pass TOTAL round score relative to par
          />
        )}

        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          dragPan={interactionMode === 'drag'}
          dragRotate={true}
          scrollZoom={true}
          touchZoom={true}
          doubleClickZoom={false}
          onClick={(e) => {
            if (interactionMode === 'aim') {
              setTargetPoint({
                lng: e.lngLat.lng,
                lat: e.lngLat.lat
              });
            }
          }}
        >
          {/* Ball Position Marker */}
          {ballPosition && (
            <Marker 
              longitude={ballPosition.lng} 
              latitude={ballPosition.lat}
              anchor="center"
            >
              <div style={modernStyles.ballMarker} />
            </Marker>
          )}

          {/* Pin Position Marker - Restore Flag SVG */}
          {pinPosition && (
            <Marker 
              longitude={pinPosition.lng} 
              latitude={pinPosition.lat}
              anchor="bottom-left" // Adjust anchor based on SVG design
              offsetLeft={-5} // Adjust offset based on SVG design
              offsetTop={-20} // Adjust offset based on SVG design
            >
               {/* Refined Flag SVG */}
               <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))' }}>
                 <path d="M10 95V5" stroke="black" strokeWidth="6" strokeLinecap="round"/>
                 <path d="M12 10H90L70 30L90 50H12V10Z" fill="#DC143C" stroke="#A00000" strokeWidth="2"/>
               </svg>
            </Marker>
          )}

          {/* Tracer Path Source & Layer */}
          {tracerPath.length > 0 && (
            <Source id="tracer-path-source" type="geojson" data={tracerSourceData}>
              <Layer
                id="tracer-path-layer"
                type="line"
                paint={{
                  'line-width': 2,
                  'line-color': '#00aaff',
                  'line-opacity': 0.8
                }}
              />
            </Source>
          )}

          {/* Course Features */}
          {renderPolygons(currentHoleGeo, 'greens', '#34d399', 0.5)}
          {renderPolygons(currentHoleGeo, 'fairway', '#abf7a6', 0.3)}
          {renderPolygons(currentHoleGeo, 'bunkers', '#f7d795', 0.6)}
          {renderPolygons(currentHoleGeo, 'water', '#4287f5', 0.4)}
          {renderPolygons(currentHoleGeo, 'ob', '#ff6666', 0.15)}
        </Map>

        {/* Aiming Overlay */}
        {ballPosition && (
          <AimingOverlay
            ballScreenPos={ballScreenPos}
            targetScreenPos={targetScreenPos}
            clampedTargetScreenPos={clampedTargetScreenPos}
            maxDistRadiusPx={maxDistRadiusPx}
            isDraggingAim={isDraggingAim}
            interactionMode={interactionMode}
            currentDistance={distanceYards(ballPosition, targetPoint || ballPosition)}
            maxClubDistance={getMaxDistanceForClubAndLie(club, currentLie)}
            isAimingOverMax={isAimingOverMax}
            clampedDistance={currentClampedDistance}
          />
        )}
      </div>

      {/* Putting Results Modal */}
      {showPuttingModal && puttingResultData && (
        <div style={modernStyles.modalOverlay}>
          <div style={modernStyles.puttingModal}>
            <h3>Hole {puttingResultData.holeNum} Complete!</h3>
            <p>Par: {puttingResultData.par}</p>
            <p>Your Score: {puttingResultData.score}</p>
            <p>Putts: {puttingResultData.putts}</p>
            <button onClick={handleProceedToNextTee} style={modernStyles.primaryButton}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GolfGame; 