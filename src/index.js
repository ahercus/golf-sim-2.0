// index.js

/******************************************************************************
 * COMPLETE SINGLE-FILE REACT CODE
 * 
 * Pebble Beach Hole #8 - Using the new "detectCollision" approach plus
 * multi-call Assistants API (3 steps: createThread, createMessage, createRun).
 * 
 * Includes:
 *   - Full geometry from your snippet (fairway, green, bunkers, OB).
 *   - "detectCollision" function to determine outcome (fairway/rough/bunker/green/ob).
 *   - A multi-step handleTakeShot that references "detectCollision(landingSpot)" 
 *     and constructs a GPT prompt context like "The ball landed in the X..."
 *   - A doAssistantConversation function that lumps the createThread -> createMessage -> createRun -> fetchAssistantMessage steps.
 *   - Mapbox display with the full polygons from your snippet.
 * 
 * 
 * REQUIREMENTS:
 *   1) .env.local with:
 *        REACT_APP_OPENAI_API_KEY=<YourOpenAIKey with Beta if using /v1/threads>
 *        REACT_APP_MAPBOX_TOKEN=<YourMapboxPublicToken>
 *   2) npm install react react-dom react-map-gl mapbox-gl
 *   3) npm start
 * 
 * If you do not have Beta access for /v1/threads, you'll get a 400 error 
 * on "createThread." Also ensure the GEOJSON polygons are valid.
 ******************************************************************************/

import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const modernStyles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f9f7'
  },

  leftPanel: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    boxShadow: '2px 0 20px rgba(0,0,0,0.05)',
    zIndex: 1
  },

  card: {
    margin: '16px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },

  header: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '16px'
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1.5px solid #e6e6e6',
    borderRadius: '12px',
    marginBottom: '12px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    '&:focus': {
      borderColor: '#34d399'
    }
  },

  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1.5px solid #e6e6e6',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    '&:focus': {
      borderColor: '#34d399'
    }
  },

  button: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#34d399',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2ebe8a',
      transform: 'translateY(-1px)'
    },
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
      transform: 'none'
    }
  },

  chatContainer: {
    flex: 1,
    margin: '16px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    overflowY: 'auto',
    marginBottom: 0
  },

  message: {
    padding: '12px 16px',
    marginBottom: '12px',
    borderRadius: '12px',
    fontSize: '15px',
    lineHeight: '1.5'
  },

  announcerMessage: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #34d399'
  },

  userMessage: {
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #38bdf8'
  },

  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: '6px'
  },

  mapContainer: {
    flex: 1,
    position: 'relative'
  },

  ballMarker: {
    width: '20px',
    height: '20px',
    backgroundColor: '#ffffff',
    border: '3px solid #34d399',
    borderRadius: '50%',
    boxShadow: '0 0 10px rgba(52, 211, 153, 0.4)',
    animation: 'pulse 2s infinite'
    },

    overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'none'   
  },

  overlayContent: {
    pointerEvents: 'auto',
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    textAlign: 'center',
    maxWidth: '400px'
  },

  overlayTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '16px'
  },

  overlayButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#34d399',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },

  overlayContent: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    textAlign: 'center',
    maxWidth: '400px'
  },

  overlayTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '16px'
  },

  overlayButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#34d399',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
  },
  
};

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

// HOLE 8 base info
const HOLE_8 = {
  tee: { lat: 36.5618204, lng: -121.9399153 },
  pin: { lat: 36.5630638, lng: -121.9365045 },
  par: 4,
  yards: 428
};

// Full geometry from snippet
const HOLE_8_FEATURES = {
  surfaces: {
    // Combined fairway from two polygons in KML
    fairway: {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-121.9383251731493, 36.56288176128835],
            [-121.9389588613623, 36.56233366204226],
            [-121.9389661943741, 36.56217337320794],
            [-121.9387445124595, 36.56210762601597],
            [-121.9383334337162, 36.56208760424978],
            [-121.938037892877, 36.56237678148714],
            [-121.9381260966974, 36.56272071900653],
            [-121.9381401163189, 36.56286678478628],
            [-121.9383251731493, 36.56288176128835]
          ],
          [
            [-121.9374057888868, 36.56333783846507],
            [-121.9375125068352, 36.56322180463712],
            [-121.9375066637495, 36.5631336673572],
            [-121.9373749992453, 36.56309940087796],
            [-121.9371552473388, 36.56310716478303],
            [-121.936902711569, 36.56298088058722],
            [-121.9366638383352, 36.56299577700662],
            [-121.9366577966105, 36.56310468772143],
            [-121.9368120308347, 36.56310046314237],
            [-121.9369233505715, 36.56319350625881],
            [-121.9369434789483, 36.56326417983487],
            [-121.9370440721566, 36.56334164833112],
            [-121.9374057888868, 36.56333783846507]
          ]
        ]
      ]
    },

    // Green complex
    green: {
      type: "Polygon",
      coordinates: [[
        [-121.9366482718333, 36.56309336832435],
        [-121.9366593853172, 36.56301973016184],
        [-121.9366027701401, 36.56300599453453],
        [-121.9365316928548, 36.56301736157788],
        [-121.9364754791584, 36.56298020708988],
        [-121.9364044093569, 36.56298097277367],
        [-121.9363855343517, 36.56301195136574],
        [-121.9364021936049, 36.56305206953746],
        [-121.9364708952453, 36.56314171163956],
        [-121.9365211559194, 36.5631640088491],
        [-121.9365753525415, 36.56314467509414],
        [-121.9366482718333, 36.56309336832435]
      ]]
    }
  },

  hazards: {
    bunkers: [
      {
        name: "greenside bunker front left",
        type: "Polygon",
        coordinates: [[
          [-121.9368992634805, 36.56325715628843],
          [-121.9369212762211, 36.56324249500292],
          [-121.9368915511184, 36.56318213619419],
          [-121.9368426718302, 36.56314735098876],
          [-121.9367063371694, 36.56316560062739],
          [-121.9366939018152, 36.56318298096978],
          [-121.9367058165791, 36.56319954436462],
          [-121.9368992634805, 36.56325715628843]
        ]]
      },
      {
        name: "fairway bunker right",
        type: "Polygon",
        coordinates: [[
          [-121.9371442584683, 36.56304084468761],
          [-121.9369882239795, 36.56293693465678],
          [-121.9369470644491, 36.56296332788934],
          [-121.9369608804181, 36.56297910129794],
          [-121.9371207422411, 36.56307728353507],
          [-121.9371442584683, 36.56304084468761]
        ]]
      },
      {
        name: "greenside bunker right",
        type: "Polygon",
        coordinates: [[
          [-121.9365388304794, 36.56299359680376],
          [-121.9366085906459, 36.56297599849029],
          [-121.9365979125435, 36.5629214028863],
          [-121.9365286533134, 36.56289697425701],
          [-121.9364112155587, 36.56291563894393],
          [-121.9364206080123, 36.56295363373683],
          [-121.9364761395609, 36.56296384920458],
          [-121.9365258455629, 36.56294495817725],
          [-121.9365388304794, 36.56299359680376]
        ]]
      },
      {
        name: "greenside bunker left",
        type: "Polygon",
        coordinates: [[
          [-121.9364512731426, 36.56322871963806],
          [-121.9364584293957, 36.56319957221598],
          [-121.9364361015258, 36.56313300352928],
          [-121.9363762798444, 36.56313559202735],
          [-121.9363694414301, 36.56317137294365],
          [-121.9364042951059, 36.56322863629346],
          [-121.9364512731426, 36.56322871963806]
        ]]
      },
      {
        name: "greenside bunker back",
        type: "Polygon",
        coordinates: [[
          [-121.9363625149966, 36.563095558837],
          [-121.9363842508121, 36.56307473566677],
          [-121.9363621094908, 36.56304881231645],
          [-121.9363662940504, 36.5630061027685],
          [-121.9363253926398, 36.56298621741529],
          [-121.9363015548238, 36.56302678798173],
          [-121.9363207555774, 36.5630913385727],
          [-121.9363625149966, 36.563095558837]
        ]]
      }
    ]
  },

  outOfBounds: {
    type: "MultiPolygon",
    coordinates: [
      // Seaside cliffs
      [[
        [-121.9384799114431, 36.56172872627251],
        [-121.9376249983524, 36.56213839311128],
        [-121.9379742224409, 36.56274495834499],
        [-121.9375337032386, 36.56287350056902],
        [-121.9369398205515, 36.5627277194931],
        [-121.9369193753225, 36.56278660936319],
        [-121.9371558569541, 36.5629793526],
        [-121.937994294907, 36.56314041662852],
        [-121.9380623509379, 36.56299460864268],
        [-121.9380032941792, 36.56249580824678],
        [-121.9377433343569, 36.56222308654823],
        [-121.9384565622862, 36.56184286310499],
        [-121.9386411739308, 36.56203711766442],
        [-121.9388490251854, 36.56202958883338],
        [-121.9384799114431, 36.56172872627251]
      ]],
      // Ocean
      [[
        [-121.9379953421487, 36.56130922814602],
        [-121.9360769483103, 36.56217618276826],
        [-121.936428420972, 36.56253125261097],
        [-121.936857595985, 36.56274632567027],
        [-121.9369641994135, 36.56269827560578],
        [-121.937533767087, 36.56285780822175],
        [-121.937943354253, 36.5627404617979],
        [-121.9375960168729, 36.56214026553246],
        [-121.9384725358793, 36.5617021865831],
        [-121.9388442392656, 36.56200189868539],
        [-121.9389730172153, 36.56186600001428],
        [-121.9389096313629, 36.56173004713786],
        [-121.9391593951031, 36.56149779117986],
        [-121.9379953421487, 36.56130922814602]
      ]]
    ]
  }
};


/** ------------------- UTILITY FUNCTIONS ------------------- **/
function distanceYards(a,b){
  if(!a||!b||!("lat" in a)||!("lng" in a)||!("lat" in b)||!("lng" in b)){
    console.warn("distanceYards invalid points:", a, b);
    return 0;
  }
  const R=6371e3;
  const lat1=(a.lat*Math.PI)/180;
  const lat2=(b.lat*Math.PI)/180;
  const dLat=((b.lat - a.lat)*Math.PI)/180;
  const dLng=((b.lng - a.lng)*Math.PI)/180;
  const s= Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  const c=2* Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
  return (R*c)*1.09361;
}

function isInPolygon(point, ring){
  if(!point||!ring) return false;
  const x= point.lng, y= point.lat;
  let inside=false;
  for(let i=0,j= ring.length-1;i<ring.length;j=i++){
    const xi= ring[i][0], yi= ring[i][1];
    const xj= ring[j][0], yj= ring[j][1];
    const intersect= ((yi>y)!==(yj>y)) && ( x< ( (xj - xi)*(y-yi)/(yj-yi)+ xi ) );
    if(intersect) inside=!inside;
  }
  return inside;
}

function isInMultiPolygon(point, geom){
  if(!geom) return false;
  if(geom.type==="Polygon"){
    return isInPolygon(point, geom.coordinates[0]);
  }
  if(geom.type==="MultiPolygon"){
    for(let i=0;i<geom.coordinates.length;i++){
      const outer= geom.coordinates[i][0];
      if(isInPolygon(point, outer)) return true;
    }
  }
  return false;
}

/** 
 * detectCollision => 
 *   returns "fairway","green","bunker","ob","rough"
 */
function detectCollision(landingSpot){
  if(isInMultiPolygon(landingSpot, HOLE_8_FEATURES.outOfBounds)){
    return "ob";
  }
  if(isInMultiPolygon(landingSpot, HOLE_8_FEATURES.surfaces.green)){
    return "green";
  }
  for(const b of (HOLE_8_FEATURES.hazards.bunkers||[])){
    if(isInMultiPolygon(landingSpot, b)){
      return "bunker";
    }
  }
  if(isInMultiPolygon(landingSpot, HOLE_8_FEATURES.surfaces.fairway)){
    return "fairway";
  }
  return "rough";
}

// Additional or alternative approach => "determineLie" is similar

function bearingBetween(a,b){
  if(!a||!b) return 0;
  const dLat=b.lat-a.lat;
  const dLng=b.lng-a.lng;
  return Math.atan2(dLat, dLng);
}

/** findOBEntryPoint => step along line if OB found */
function findOBEntryPoint(start, end){
  let steps=50;
  const latInc=(end.lat- start.lat)/steps;
  const lngInc=(end.lng- start.lng)/steps;
  let prev={...start};
  for(let i=1;i<=steps;i++){
    const testPos={ lat: start.lat+ latInc*i, lng: start.lng+ lngInc*i };
    if(isInMultiPolygon(testPos, HOLE_8_FEATURES.outOfBounds)){
      return {
        lat: prev.lat+ latInc*0.5,
        lng: prev.lng+ lngInc*0.5
      };
    }
    prev=testPos;
  }
  return end;
}

// parseShotJSON => extracts { ... } block
function parseShotJSON(str){
  const match= str.match(/\{[\s\S]*\}/);
  if(!match) return null;
  try{
    return JSON.parse(match[0]);
  } catch(e){
    return null;
  }
}

// -------------- 3-step Assistants API calls --------------

// Environment variable for your key
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// 1) createThread
async function createThread() {
  console.log("[createThread] => POST /v1/threads");
  const res = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      // minimal shape
      messages: []
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`createThread error: ${res.status} - ${err.message}`);
  }

  const obj = await res.json();
  console.log("[createThread] =>", obj);
  return obj;
}

// 2) createThreadMessage (the single, correct version)
async function createThreadMessage(thread_id, role, userMsg) {
  console.log(`[createThreadMessage] => /v1/threads/${thread_id}/messages, role=${role}, content=`, userMsg);

  const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      role,  // "user" or "assistant"
      // The Assistants API expects an array of content segments
      content: [
        {
          type: "text",
          text: userMsg
        }
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

// 3) createRun
async function createRun(thread_id) {
  console.log(`[createRun] => /v1/threads/${thread_id}/runs with assistant_id=${ASSISTANT_ID}`);
  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID
    })
  });

  if (!runRes.ok) {
    const err = await runRes.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`createRun error: ${runRes.status} - ${err.message}`);
  }

  let runObj = await runRes.json();
  console.log("[createRun] => initial runObj:", runObj);

  // Poll until completed or fails
  while (!["completed","failed","cancelled","incomplete","expired"].includes(runObj.status)) {
    console.log("[createRun] polling status:", runObj.status);
    await new Promise(r => setTimeout(r, 1200));
    const poll = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${runObj.id}`, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
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

// 4) fetchAssistantMessage
async function fetchAssistantMessage(thread_id) {
  console.log(`[fetchAssistantMessage] => listing messages for thread=${thread_id}`);
  const list = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?order=desc&limit=10`, {
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
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

/**
 * doAssistantConversation(userContent):
 *   1) createThread
 *   2) createThreadMessage(thread.id, "user", userContent)
 *   3) createRun(thread.id)
 *   4) fetchAssistantMessage(thread.id)
 */
async function doAssistantConversation(userContent, threadId = null) {
  // If we have a threadId, re-use it. Otherwise, create a new thread.
  let actualThreadId = threadId;
  if (!actualThreadId) {
    const threadObj = await createThread();
    actualThreadId = threadObj.id;
  }

  // 1) Add the user message to that existing or newly created thread
  await createThreadMessage(actualThreadId, "user", userContent);

  // 2) Create a run on that same thread
  await createRun(actualThreadId);

  // 3) Get the assistant's reply from that same thread
  const reply = await fetchAssistantMessage(actualThreadId);
  if (!reply) {
    throw new Error("No assistant message found after run completion.");
  }

  // Return both the text and the thread ID so the caller can store it
  return { reply, threadId: actualThreadId };
}


// ============== MAIN REACT COMPONENT ================
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
  const [showGreenOverlay, setShowGreenOverlay] = useState(false);
  const handleMouseDown = useCallback((e) => {
  if (animating) return;
  
  const centerX = ballPos.lng;
  const centerY = ballPos.lat;
  
  const clickLng = e.lngLat.lng;
  const clickLat = e.lngLat.lat;
  
  const angleRad = Math.atan2(clickLat - centerY, clickLng - centerX);
  const baseBearing = bearingBetween(ballPos, HOLE_8.pin);
  const angleDeg = ((angleRad - baseBearing) * 180 / Math.PI);
  
  setAim(angleDeg.toFixed(1));
}, [ballPos, animating]);

  // UI fields
  const [windSpeed, setWindSpeed] = useState("10");
  const [windDir, setWindDir] = useState("45");
  const [club, setClub] = useState("Driver");
  const [aim, setAim] = useState("10");
  const [shotInput, setShotInput] = useState("");

  // Helper for resetting the hole
  function handleReplayHole() {
    setBallPos({ ...HOLE_8.tee });
    setMessages([]);
    setShotCount(0);
    setScore(0);
    setIsFirstShot(true);
    setShowGreenOverlay(false);
  }

  // Utility to add messages
  function addAnnouncer(txt) {
    setMessages((prev) => [...prev, { sender: "Announcer", text: txt }]);
  }
  function addUser(txt) {
    setMessages((prev) => [...prev, { sender: "You", text: txt }]);
  }

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

  // Animate the ball flight from start->end
  function animateBall(start, end) {
    return new Promise((resolve) => {
      let steps = 30,
        step = 0,
        ms = 1500;
      const latDelta = (end.lat - start.lat) / steps;
      const lngDelta = (end.lng - start.lng) / steps;
      const interval = setInterval(() => {
        step++;
        setBallPos({
          lat: start.lat + latDelta * step,
          lng: start.lng + lngDelta * step
        });
        if (step >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, ms / steps);
    });
  }

  // Compute new lat/lng after shot
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

  // Example base distances for clubs
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

  // Example lie multipliers
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

  // Main shot function
  async function handleTakeShot() {
    if (!shotInput.trim() || animating) return;
  
    addUser(shotInput);
    setShotInput("");
    setAnimating(true);
    setShotCount((c) => c + 1);
  
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
    let newThreadId = gptThreadId; // We'll store the updated thread here
    try {
      const step1Result = await doAssistantConversation(step1Prompt, gptThreadId);
      step1ReplyString = step1Result.reply;
      newThreadId = step1Result.threadId;
      // Update React state too, but do NOT rely on it for Step 2
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
      setScore((s) => s + 1);
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
      // IMPORTANT: Use newThreadId here instead of gptThreadId
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
  
  


  // RENDER
  return (
    <div style={modernStyles.container}>
      <style>{keyframes}</style>

{/* LEFT Panel */}
<div style={modernStyles.leftPanel}>
  {/* Handicap input */}
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

  {/* Start hole */}
  {gotHandicap && !started && (
    <div style={modernStyles.card}>
      <h2 style={modernStyles.header}>Pebble Beach - Hole 8</h2>
      <p style={modernStyles.label}>Par {HOLE_8.par}, {HOLE_8.yards} yards</p>
      <button style={modernStyles.button} onClick={handleStart}>
        Begin Hole
      </button>
    </div>
  )}

  {/* Main Game UI */}
  {gotHandicap && started && (
    <>
      {/* Commentary Feed */}
      <div style={modernStyles.chatContainer}>
        {messages.map((m, i) => {
          if (m.sender === "Announcer") {
            return (
              <div key={i} style={{ ...modernStyles.message, ...modernStyles.announcerMessage }}>
                <strong>Announcer:</strong> {m.text}
              </div>
            );
          }
          return (
            <div key={i} style={{ ...modernStyles.message, ...modernStyles.userMessage }}>
              <strong>You:</strong> {m.text}
            </div>
          );
        })}
      </div>

      {/* Controls Section */}
      <div style={modernStyles.card}>
        {/* Compact Scorecard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#34d399' }}>
            Shots: {shotCount}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#34d399' }}>
            Total: {score}
          </div>
        </div>

        {/* Club Selection */}
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

        {/* Shot Input */}
        <textarea
          style={{ ...modernStyles.input, height: '96px', marginBottom: '16px' }}
          placeholder="Describe your shot..."
          value={shotInput}
          onChange={(e) => setShotInput(e.target.value)}
        />

        {/* Take Shot Button */}
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

      

      {/* RIGHT Panel - Map */}
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

        // 1) Add terrain source
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

        // 2) Custom hillshading layer
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

        // 3) Random time-of-day lighting
        const randomAzimuth = Math.floor(Math.random() * 360);
        const randomAltitude = 20 + Math.random() * 50; // 20..70
        map.setLight({
          anchor: "map",
          position: [randomAzimuth, randomAltitude],
          color: "white",
          intensity: 0.5
        });

        // 4) 3D Buildings: satellite-streets-v11 has building footprints
        const layers = map.getStyle().layers;
        // find first symbol layer to place 3D buildings below it
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
            {/* Fairway */}
            <Source
              id="fairway-src"
              type="geojson"
              data={{
                type: "Feature",
                geometry: HOLE_8_FEATURES.surfaces.fairway
              }}
            >
              <Layer
                id="fairway-layer"
                type="fill"
                paint={{ "fill-color": "#4ade80", "fill-opacity": 0 }}
              />
            </Source>

            {/* Green */}
            <Source
              id="green-src"
              type="geojson"
              data={{
                type: "Feature",
                geometry: HOLE_8_FEATURES.surfaces.green
              }}
            >
              <Layer
                id="green-layer"
                type="fill"
                paint={{ "fill-color": "#34d399", "fill-opacity": 0 }}
              />
            </Source>

            {/* Out of Bounds */}
            <Source
              id="ob-src"
              type="geojson"
              data={{
                type: "Feature",
                geometry: HOLE_8_FEATURES.outOfBounds
              }}
            >
              <Layer
                id="ob-layer"
                type="fill"
                paint={{ "fill-color": "#ef4444", "fill-opacity": 0 }}
              />
            </Source>

            {/* Bunkers */}
            <Source
              id="bunkers"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: (HOLE_8_FEATURES.hazards.bunkers || []).map((bk, idx) => ({
                  type: "Feature",
                  geometry: bk,
                  properties: { id: idx }
                }))
              }}
            >
              <Layer
                id="bunker-layer"
                type="fill"
                paint={{ "fill-color": "#F9D57F", "fill-opacity": 0 }}
              />
            </Source>
            // Add inside Map component, right before the Ball Marker
            <Source
  id="aim-line"
  type="geojson"
  data={{
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [ballPos.lng, ballPos.lat],
        [
          ballPos.lng + Math.cos((bearingBetween(ballPos, HOLE_8.pin) + (parseInt(aim) * Math.PI / 180))) * 0.0015,
          ballPos.lat + Math.sin((bearingBetween(ballPos, HOLE_8.pin) + (parseInt(aim) * Math.PI / 180))) * 0.0015
        ]
      ]
    }
  }}>
  <Layer
    id="aim-line-layer"
    type="line"
    paint={{
      'line-color': '#34d399',
      'line-width': 2,
      'line-dasharray': [2, 2],
      'line-opacity': 0.8
    }}
  />
</Source>

            {/* Ball Marker */}
            <Marker latitude={ballPos.lat} longitude={ballPos.lng} anchor="center">
              <div style={modernStyles.ballMarker} />
            </Marker>

            {/* Pin Marker */}
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
            {/* Wind Direction Overlay */}
            <div style={{
  position: 'absolute',
  top: '20px',
  right: '20px',
  width: '80px',
  height: '60px',
  zIndex: 10,
  pointerEvents: 'none'
}}>
<svg viewBox="0 0 80 60">
  <g transform={`rotate(${windDir}, 40, 30)`} className="wind-arrow">
    <path d="M45 35
             L10 30
             L45 25
             Z" 
          fill="#34d399"/>
  </g>
    <text x="40" y="55" 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" 
          fontSize="14" 
          fill="#34d399" 
          fontWeight="600">
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

// Attach to the root
const root = createRoot(document.getElementById("root"));
root.render(<Hole8Game />);
