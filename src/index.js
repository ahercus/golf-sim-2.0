// src/index.js
//updated
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Import your PebbleData
import { PebbleData } from './courseData/PebbleData.js';
// Import the separated styles
import { modernStyles } from './styles/Hole8Styles.js';

const keyframes = `
  @keyframes pulse {
    0% { 
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4);
    }
    70% { 
      transform: scale(1.1);
      box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
    }
    100% { 
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
    }
  }
  @keyframes windJiggle {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(2deg); }
    75% { transform: rotate(-2deg); }
    100% { transform: rotate(0deg); }
  }
  .wind-arrow {
    animation: windJiggle 3s ease-in-out infinite;
    transform-origin: 40px 30px;
  }
`;

const ASSISTANT_ID = "asst_2MmxTf13uHuYYARbEsDX4Sdm";
const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const HOLE_8 = {
  tee: { lat: 36.5618204, lng: -121.9399153 },
  pin: { lat: 36.5630638, lng: -121.9365045 },
  par: 4,
  yards: 428
};

function distanceYards(a, b) {
  if(!a || !b || !("lat" in a) || !("lng" in a) || !("lat" in b) || !("lng" in b)){
    console.warn("distanceYards invalid points:", a, b);
    return 0;
  }
  const R = 6371e3;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return (R * c) * 1.09361;
}

function isInPolygon(point, ring) {
  if(!point || !ring) return false;
  const x = point.lng, y = point.lat;
  let inside = false;
  for(let i=0, j=ring.length - 1; i < ring.length; j = i++){
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi) / (yj - yi) + xi));
    if(intersect) inside = !inside;
  }
  return inside;
}

function isInMultiPolygon(point, geom) {
  if(!geom) return false;
  if(geom.type === "Polygon"){
    return isInPolygon(point, geom.coordinates[0]);
  }
  if(geom.type === "MultiPolygon"){
    for(let i=0; i < geom.coordinates.length; i++){
      const outer = geom.coordinates[i][0];
      if(isInPolygon(point, outer)){
        return true;
      }
    }
  }
  return false;
}

// detectCollision => "fairway", "green", "bunker", "ob", "rough"
function detectCollision(landingSpot) {
  const hole8 = PebbleData[8];
  

  // Out of Bounds
  if (hole8.ob) {
    for (const obPoly of hole8.ob) {
      if (isInMultiPolygon(landingSpot, obPoly)) {
        return "ob";
      }
    }
  }

  // Greens
  if (hole8.greens) {
    for (const greenPoly of hole8.greens) {
      if (isInMultiPolygon(landingSpot, greenPoly)) {
        return "green";
      }
    }
  }

  // Bunkers
  if (hole8.bunkers) {
    for (const bunkerPoly of hole8.bunkers) {
      if (isInMultiPolygon(landingSpot, bunkerPoly)) {
        return "bunker";
      }
    }
  }

  // Water
  if (hole8.water) {
    for (const waterPoly of hole8.water) {
      if (isInMultiPolygon(landingSpot, waterPoly)) {
        return "water";
      }
    }
  }

  // Fairway
  if (hole8.fairway) {
    const fairways = Array.isArray(hole8.fairway) ? hole8.fairway : [hole8.fairway];
    for (const fw of fairways) {
      if (isInMultiPolygon(landingSpot, fw)) {
        return "fairway";
      }
    }
  }

  // Default => Rough
  return "rough";
}


function bearingBetween(a, b) {
  if(!a || !b) return 0;
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  return Math.atan2(dLat, dLng);
}

function findOBEntryPoint(start, end) {
  let steps = 50;
  const latInc = (end.lat - start.lat) / steps;
  const lngInc = (end.lng - start.lng) / steps;
  let prev = { ...start };
  for(let i=1; i <= steps; i++){
    const testPos = { lat: start.lat + latInc*i, lng: start.lng + lngInc*i };
    if(detectCollision(testPos) === "ob"){
      return {
        lat: prev.lat + latInc * 0.5,
        lng: prev.lng + lngInc * 0.5
      };
    }
    prev = testPos;
  }
  return end;
}

function parseShotJSON(str){
  const match = str.match(/\{[\s\S]*\}/);
  if(!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch(e){
    return null;
  }
}

async function createThread() {
  console.log("[createThread] => POST /v1/threads");
  const res = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({ messages: [] })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`createThread error: ${res.status} - ${err.message}`);
  }
  const obj = await res.json();
  console.log("[createThread] =>", obj);
  return obj;
}

async function createThreadMessage(thread_id, role, userMsg) {
  console.log(`[createThreadMessage] => /v1/threads/${thread_id}/messages, role=${role}, content=`, userMsg);
  const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      role,
      content: [
        { type: "text", text: userMsg }
      ]
    })
  });

  if (!msgRes.ok) {
    const err = await msgRes.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`createThreadMessage error: ${msgRes.status} - ${err.message}`);
  }
  const msg = await msgRes.json();
  console.log("[createThreadMessage] =>", msg);
  return msg;
}

async function createRun(thread_id) {
  console.log(`[createRun] => /v1/threads/${thread_id}/runs with assistant_id=${ASSISTANT_ID}`);
  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({ assistant_id: ASSISTANT_ID })
  });
  if (!runRes.ok) {
    const err = await runRes.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`createRun error: ${runRes.status} - ${err.message}`);
  }

  let runObj = await runRes.json();
  console.log("[createRun] => initial runObj:", runObj);

  while (!["completed","failed","cancelled","incomplete","expired"].includes(runObj.status)) {
    console.log("[createRun] polling status:", runObj.status);
    await new Promise(r => setTimeout(r, 1200));
    const poll = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${runObj.id}`, {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });
    runObj = await poll.json();
  }

  console.log("[createRun] final status:", runObj.status);
  if (runObj.status !== "completed") {
    throw new Error(`Run ended with status=${runObj.status}`);
  }
  return runObj;
}

async function fetchAssistantMessage(thread_id) {
  console.log(`[fetchAssistantMessage] => listing messages for thread=${thread_id}`);
  const list = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?order=desc&limit=10`, {
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  });
  if (!list.ok) {
    const err = await list.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`fetchAssistantMessage error: ${list.status} - ${err.message}`);
  }

  const data = await list.json();
  for (const m of data.data) {
    if (m.role === "assistant") {
      const arr = m.content || [];
      return arr.map(seg => seg.text?.value || "").join("");
    }
  }
  return null;
}

async function doAssistantConversation(userContent, threadId = null) {
  let actualThreadId = threadId;
  if (!actualThreadId) {
    const threadObj = await createThread();
    actualThreadId = threadObj.id;
  }
  await createThreadMessage(actualThreadId, "user", userContent);
  await createRun(actualThreadId);
  const reply = await fetchAssistantMessage(actualThreadId);
  if (!reply) {
    throw new Error("No assistant message found after run completion.");
  }
  return { reply, threadId: actualThreadId };
}

function Hole8Game() {
  const [handicap, setHandicap] = useState("");
  const [gotHandicap, setGotHandicap] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [shotCount, setShotCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gptThreadId, setGptThreadId] = useState(null);
  const [holeFinished, setHoleFinished] = useState(false);

  const [ballPos, setBallPos] = useState({ ...HOLE_8.tee });
  const [animating, setAnimating] = useState(false);
  const [isFirstShot, setIsFirstShot] = useState(true);

  const [windSpeed, setWindSpeed] = useState("10");
  const [windDir, setWindDir] = useState("45");
  const [club, setClub] = useState("Driver");
  const [aim, setAim] = useState("10");
  const [shotInput, setShotInput] = useState("");

  const [ballTrajectory, setBallTrajectory] = useState([]);
  const [ballTracer, setBallTracer] = useState([]);

  const handleMouseDown = useCallback(e => {
    if (animating) return;
  
    // Dot/cross approach:
    const pinVector = {
      x: HOLE_8.pin.lng - ballPos.lng,
      y: HOLE_8.pin.lat - ballPos.lat
    };
    const clickVector = {
      x: e.lngLat.lng - ballPos.lng,
      y: e.lngLat.lat - ballPos.lat
    };
  
    const dot = pinVector.x * clickVector.x + pinVector.y * clickVector.y;
    const pinMag = Math.sqrt(pinVector.x**2 + pinVector.y**2);
    const clickMag = Math.sqrt(clickVector.x**2 + clickVector.y**2);
    if (pinMag === 0 || clickMag === 0) return;
  
    let angleDeg = Math.acos(dot / (pinMag * clickMag)) * (180 / Math.PI);
  
    // Cross product => sign
    const cross = pinVector.x * clickVector.y - pinVector.y * clickVector.x;
    if (cross < 0) angleDeg = -angleDeg;
  
    setAim(angleDeg.toFixed(1));
  }, [ballPos, animating]);

  function handleApplyHandicap() {
    if (!handicap.trim()) {
      alert("Enter a valid handicap e.g. 20");
      return;
    }
    setGotHandicap(true);
  }

  function handleStart() {
    setStarted(true);
    addAnnouncer(`Welcome to Hole #8 at Pebble Beach! Par 4, 428 yards.`);
  }

  function handleReplayHole() {
    setBallPos({ ...HOLE_8.tee });
    setMessages([]);
    setShotCount(0);
    setScore(0);
    setIsFirstShot(true);
    setHoleFinished(false);
  }

  function addAnnouncer(txt) {
    setMessages(prev => [...prev, { sender: "Announcer", text: txt }]);
  }
  function addUser(txt) {
    setMessages(prev => [...prev, { sender: "You", text: txt }]);
  }

  function animateBall(start, end) {
    return new Promise((resolve) => {
      const trajectory = calculateGolfTrajectory(start, end, {
        power: 1.0,
        launchAngle: 12,
        windSpeed: parseInt(windSpeed),
        windDir: parseInt(windDir)
      });
      
      setBallTrajectory(trajectory);
      
      let step = 0;
      const steps = trajectory.length;
      const ms = 2000;  // Total animation duration
      
      const interval = setInterval(() => {
        if (step >= steps) {
          clearInterval(interval);
          setBallTracer([]);
          setBallTrajectory([]);
          resolve();
          return;
        }
        
        const pos = trajectory[step];
        setBallPos(pos);
        
        // Update tracer - keep last 12 positions
        setBallTracer(prev => {
          const newTracer = [...prev, pos];
          return newTracer.slice(-12);
        });
        
        step++;
      }, ms/steps);
    });
  }

  function calculateGolfTrajectory(start, end, params) {
    const {
      power = 1.0,        // 0-1 power factor
      launchAngle = 12,   // degrees
      windSpeed = 0,      // mph
      windDir = 0         // degrees
    } = params;
  
    const points = [];
    const initialVelocity = 160 * power * 0.44704; // mph to m/s
    const timeStep = 0.05;
    const windRad = (windDir * Math.PI) / 180;
    const windVx = windSpeed * Math.cos(windRad) * 0.44704;
    const windVy = windSpeed * Math.sin(windRad) * 0.44704;
    
    // Starting position
    let x = start.lng;
    let y = start.lat;
    let z = 0;  // height in meters
    
    // Initial velocities
    const launchRad = (launchAngle * Math.PI) / 180;
    const bearing = bearingBetween(start, end);
    let vx = initialVelocity * Math.cos(launchRad) * Math.cos(bearing);
    let vy = initialVelocity * Math.cos(launchRad) * Math.sin(bearing);
    let vz = initialVelocity * Math.sin(launchRad);
    
    // Constants
    const g = 9.81;    // gravity
    const drag = 0.1;  // air resistance
    
    while (z >= 0 && distanceYards({lat: y, lng: x}, end) > 5) {
      // Update velocities with drag, gravity and wind
      vx = (vx + windVx * timeStep) * (1 - drag * timeStep);
      vy = (vy + windVy * timeStep) * (1 - drag * timeStep);
      vz = vz * (1 - drag * timeStep) - g * timeStep;
      
      // Update positions
      x += vx * timeStep * 0.000009; // Convert to degrees
      y += vy * timeStep * 0.000009; // Convert to degrees
      z += vz * timeStep;
      
      points.push({ lat: y, lng: x, altitude: z });
    }
    
    return points;
  }

  function computeNewPos(distance, directionDeg) {
    const bearingVal = bearingBetween(ballPos, HOLE_8.pin);
    const shotRad = (directionDeg * Math.PI) / 180;
    const finalAngle = bearingVal + shotRad;
    const yardToDeg = 0.000009;
    const latOffset = distance * yardToDeg * Math.sin(finalAngle);
    const lngOffset = distance * yardToDeg * Math.cos(finalAngle);
    return {
      lat: ballPos.lat + latOffset,
      lng: ballPos.lng + lngOffset
    };
  }

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
    bunker: 0.5
  };

  function getMaxDistanceForClubAndLie(clubName, lie) {
    const base = CLUB_BASE_DISTANCE[clubName] || 0;
    const mult = LIE_MULTIPLIER[lie] || 1.0;
    return Math.round(base * mult);
  }

  async function handleTakeShot() {
    if (!shotInput.trim() || animating) return;
    addUser(shotInput);
    setShotInput("");
    setAnimating(true);
    setShotCount(c => c + 1);

    const rawDist = distanceYards(ballPos, HOLE_8.pin);
    const distToPin = (rawDist && !isNaN(rawDist)) ? rawDist.toFixed(1) : "999";
    const shotLie = isFirstShot ? "tee" : detectCollision(ballPos);
    const adjustedMaxDist = getMaxDistanceForClubAndLie(club, shotLie);

    const step1Prompt = `
Return dice rolls, TDS, shot outcome in JSON (no commentary).
Context:
- Handicap: ${handicap}
- Lie: ${shotLie}
- Club: ${club} (maxDist=${adjustedMaxDist})
- Wind Speed: ${windSpeed}
- Wind Dir: ${windDir}
- Aim offset: ${aim} deg
- DistToPin: ${distToPin} yards
- ShotDesc: "${shotInput}"
    `.trim();

    console.log("[handleTakeShot] Step1 prompt =>", step1Prompt);

    let step1ReplyString = "";
    let newThreadId = gptThreadId;
    try {
      const step1Result = await doAssistantConversation(step1Prompt, gptThreadId);
      step1ReplyString = step1Result.reply;
      newThreadId = step1Result.threadId;
      setGptThreadId(newThreadId);
    } catch (err) {
      console.error(err);
      addAnnouncer(`(Error retrieving dice data: ${err.message})`);
      setAnimating(false);
      return;
    }

    const shotJson = parseShotJSON(step1ReplyString);
    if (!shotJson) {
      addAnnouncer("No valid JSON. Try again?");
      setAnimating(false);
      return;
    }

    const distance = shotJson.distance || 0;
    const direction = shotJson.direction || 0;

    setAnimating(true);
    const startPos = { ...ballPos };
    const endPos = computeNewPos(distance, direction);
    await animateBall(startPos, endPos);
    setAnimating(false);

    const outcome = detectCollision(endPos);
    let finalPos = endPos;
    if (outcome === "ob") {
      const entry = findOBEntryPoint(startPos, endPos);
      finalPos = entry;
      setBallPos(entry);
      addAnnouncer("OB! We'll drop at entry, penalty stroke added.");
      setScore(s => s + 1);
    } else {
      setBallPos(endPos);
    }

    const remainingDist = distanceYards(finalPos, HOLE_8.pin).toFixed(1);
    let step2Prompt;
    if (outcome === "green") {
      step2Prompt = `
We ended on the green. Provide a single combined commentary describing:
1) The final approach shot
2) The entire putting sequence, tailored to the player's skill level
Return EXACT valid JSON with integer "shots" and string "commentary", no code blocks or extraneous text.
Example:
{
  "shots": 5,
  "commentary": "Single combined approach + putting commentary..."
}
      `.trim();
    } else {
      step2Prompt = `
The ball landed in the ${outcome}.
You are now ${remainingDist} yards from the pin.
Provide broadcast commentary in one paragraph (no numeric data or dice references).
Return EXACT valid JSON with integer "shots" and string "commentary", no code blocks or extraneous text.
Example:
{
  "shots": 6,
  "commentary": "One paragraph commentary..."
}
      `.trim();
    }

    try {
      const step2Result = await doAssistantConversation(step2Prompt, newThreadId);
      const step2ReplyString = step2Result.reply;
      console.log("[handleTakeShot] Step2 =>", step2ReplyString);

      const finalObj = parseShotJSON(step2ReplyString);
      if (!finalObj || typeof finalObj.shots !== "number" || !finalObj.commentary) {
        addAnnouncer(step2ReplyString);
      } else {
        setShotCount(finalObj.shots);
        addAnnouncer(finalObj.commentary);
        if (outcome === "green") {
          setHoleFinished(true);
        }
      }
    } catch (e) {
      console.error(e);
      addAnnouncer(`(Error retrieving final commentary: ${e.message})`);
    } finally {
      setAnimating(false);
      if (isFirstShot) setIsFirstShot(false);
      setShotInput("");
    }
  }

  return (
    <div style={modernStyles.container}>
      <style>{keyframes}</style>

      <div style={modernStyles.leftPanel}>
        {!gotHandicap && (
          <div style={modernStyles.card}>
            <h2 style={modernStyles.header}>Enter Handicap</h2>
            <input
              type="number"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              style={modernStyles.input}
              placeholder="Enter 0-36"
            />
            <button style={modernStyles.button} onClick={handleApplyHandicap}>
              Start Round
            </button>
          </div>
        )}

        {gotHandicap && !started && (
          <div style={modernStyles.card}>
            <h2 style={modernStyles.header}>Pebble Beach - Hole 8</h2>
            <p style={modernStyles.label}>
              Par {HOLE_8.par}, {HOLE_8.yards} yards
            </p>
            <button style={modernStyles.button} onClick={handleStart}>
              Begin Hole
            </button>
          </div>
        )}

        {gotHandicap && started && (
          <>
            <div style={modernStyles.chatContainer}>
              {messages.map((m, i) => {
                if (m.sender === "Announcer") {
                  return (
                    <div
                      key={i}
                      style={{ ...modernStyles.message, ...modernStyles.announcerMessage }}
                    >
                      <strong>Announcer:</strong> {m.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    style={{ ...modernStyles.message, ...modernStyles.userMessage }}
                  >
                    <strong>You:</strong> {m.text}
                  </div>
                );
              })}
            </div>

            <div style={modernStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#34d399' }}>
                  Shots: {shotCount}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#34d399' }}>
                  Total: {score}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <label style={modernStyles.label}>Club Selection</label>
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  style={{ ...modernStyles.select, flex: 1 }}
                >
                  <option>Driver</option>
                  <option>3 Wood</option>
                  <option>5 Wood</option>
                  <option>3 Iron</option>
                  <option>4 Iron</option>
                  <option>5 Iron</option>
                  <option>6 Iron</option>
                  <option>7 Iron</option>
                  <option>8 Iron</option>
                  <option>9 Iron</option>
                  <option>Pitching Wedge</option>
                  <option>Gap Wedge</option>
                  <option>Sand Wedge</option>
                  <option>Lob Wedge</option>
                </select>
              </div>

              <textarea
                style={{ ...modernStyles.input, height: '96px', marginBottom: '16px' }}
                placeholder="Describe your shot..."
                value={shotInput}
                onChange={(e) => setShotInput(e.target.value)}
              />

              <button
                style={modernStyles.button}
                onClick={holeFinished ? handleReplayHole : handleTakeShot}
                disabled={animating}
              >
                {animating
                  ? "Ball in Motion..."
                  : holeFinished
                    ? "Replay Hole"
                    : "Take Shot"}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={modernStyles.mapContainer}>
        {MAPBOX_TOKEN ? (
          <Map
            initialViewState={{
              latitude: HOLE_8.tee.lat,
              longitude: HOLE_8.tee.lng,
              zoom: 17,
              pitch: 60,
              bearing: 20
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            onMouseDown={handleMouseDown}
            onLoad={(evt) => {
              const map = evt.target;
              map.addSource("mapbox-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                tileSize: 512,
                maxzoom: 14
              });
              map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

              map.addLayer({
                id: "hillshading",
                type: "hillshade",
                source: "mapbox-dem",
                paint: {
                  "hillshade-shadow-color": "#2c3e50",
                  "hillshade-highlight-color": "#ecf0f1",
                  "hillshade-exaggeration": 0.5
                }
              });

              const randomAzimuth = Math.floor(Math.random() * 360);
              const randomAltitude = 20 + Math.random() * 50;
              map.setLight({
                anchor: "map",
                position: [randomAzimuth, randomAltitude],
                color: "white",
                intensity: 0.5
              });

              const layers = map.getStyle().layers;
              const labelLayerId = layers.find(
                (layer) => layer.type === "symbol" && layer.layout["text-field"]
              )?.id;
              if (labelLayerId) {
                map.addLayer(
                  {
                    id: "3d-buildings",
                    source: "composite",
                    "source-layer": "building",
                    type: "fill-extrusion",
                    minzoom: 15,
                    paint: {
                      "fill-extrusion-color": "#aaa",
                      "fill-extrusion-height": ["get", "height"],
                      "fill-extrusion-base": ["get", "min_height"],
                      "fill-extrusion-opacity": 0.6
                    }
                  },
                  labelLayerId
                );
              }
            }}
          >
{(() => {
  const hole8 = PebbleData[8] || {};
  return (
    <>
      {/* Out of Bounds */}
      <Source
        id="hole8-ob"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: (hole8.ob || []).map((o, idx) => ({
            type: "Feature",
            geometry: o,
            properties: {}
          }))
        }}
      >
        <Layer
          id="ob-layer"
          type="fill"
          paint={{
            "fill-color": "#ef4444",
            "fill-opacity": 0.5
          }}
        />
      </Source>

      {/* Bunkers */}
      <Source
        id="hole8-bunkers"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: (hole8.bunkers || []).map((bk, idx) => ({
            type: "Feature",
            geometry: bk,
            properties: {}
          }))
        }}
      >
        <Layer
          id="bunkers-layer"
          type="fill"
          paint={{
            "fill-color": "#f9d57f",
            "fill-opacity": 0.5
          }}
        />
      </Source>

      {/* Greens */}
      <Source
        id="hole8-greens"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: (hole8.greens || []).map((gr, idx) => ({
            type: "Feature",
            geometry: gr,
            properties: {}
          }))
        }}
      >
        <Layer
          id="greens-layer"
          type="fill"
          paint={{
            "fill-color": "#34d399",
            "fill-opacity": 0.5
          }}
        />
      </Source>

      {/* Water */}
      <Source
        id="hole8-water"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: (hole8.water || []).map((wt, idx) => ({
            type: "Feature",
            geometry: wt,
            properties: {}
          }))
        }}
      >
        <Layer
          id="water-layer"
          type="fill"
          paint={{
            "fill-color": "#5eb3ff",
            "fill-opacity": 0.5
          }}
        />
      </Source>

      {/* Fairway */}
      <Source
        id="hole8-fairway"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: (
            hole8.fairway
              ? Array.isArray(hole8.fairway)
                ? hole8.fairway
                : [hole8.fairway]
              : []
          ).map((fw, idx) => ({
            type: "Feature",
            geometry: fw,
            properties: {}
          }))
        }}
      >
        <Layer
          id="fairway-layer"
          type="fill"
          paint={{
            "fill-color": "#4ade80",
            "fill-opacity": 0.5
          }}
        />
      </Source>

      {/* Aim Line */}
      <Source
        id="aim-line"
        type="geojson"
        data={{
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [ballPos.lng, ballPos.lat],
              [
                ballPos.lng +
                  Math.cos(
                    bearingBetween(ballPos, HOLE_8.pin) +
                      parseInt(aim) * Math.PI / 180
                  ) * 0.0015,
                ballPos.lat +
                  Math.sin(
                    bearingBetween(ballPos, HOLE_8.pin) +
                      parseInt(aim) * Math.PI / 180
                  ) * 0.0015
              ]
            ]
          }
        }}
      >
        <Layer
          id="aim-line-layer"
          type="line"
          paint={{
            "line-color": "#34d399",
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": 0.8
          }}
        />
      </Source>
    </>
  );
})()}

{ballTrajectory.length > 0 && (
  <Source
    id="trajectory-path"
    type="geojson"
    data={{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: ballTrajectory.map(p => [p.lng, p.lat, p.altitude])
      }
    }}
  >
    <Layer
      id="trajectory-line"
      type="line"
      paint={{
        'line-color': 'rgba(255,255,255,0.2)',
        'line-width': 1,
        'line-dasharray': [2, 2]
      }}
      layout={{
        'line-cap': 'round',
        'line-join': 'round'
      }}
    />
  </Source>
)}

{/* Red tracer */}
{ballTracer.length > 1 && (
  <Source
    id="ball-tracer"
    type="geojson"
    data={{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: ballTracer.map(p => [p.lng, p.lat, p.altitude])
      }
    }}
  >
    <Layer
      id="tracer-line"
      type="line"
      paint={{
        'line-color': '#ef4444',
        'line-width': 4,
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['distance-from-center'],
          0, 0.8,
          0.1, 0
        ]
      }}
      layout={{
        'line-cap': 'round',
        'line-join': 'round'
      }}
    />
  </Source>
)}

            <Marker latitude={ballPos.lat} longitude={ballPos.lng} anchor="center">
              <div style={modernStyles.ballMarker} />
            </Marker>
            <Marker latitude={HOLE_8.pin.lat} longitude={HOLE_8.pin.lng} anchor="center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="red"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: "translate(-12px, -24px)" }}
              >
                <path d="M9 2L9 22" />
                <path d="M9 2L19 8L9 14" />
              </svg>
            </Marker>
            <div style={modernStyles.windOverlay}>
              <svg viewBox="0 0 80 60">
                <g transform={`rotate(${windDir}, 40, 30)`} className="wind-arrow">
                  <path
                    d="M45 35
                      L10 30
                      L45 25
                      Z"
                    fill="#34d399"
                  />
                </g>
                <text
                  x="40"
                  y="55"
                  textAnchor="middle"
                  fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
                  fontSize="14"
                  fill="#34d399"
                  fontWeight="600"
                >
                  {windSpeed} mph
                </text>
              </svg>
            </div>
          </Map>
        ) : (
          <div style={{ padding: "16px" }}>
            <p>Map not available. Check REACT_APP_MAPBOX_TOKEN in .env.local</p>
          </div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<Hole8Game />);
