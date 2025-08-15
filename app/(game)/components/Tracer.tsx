"use client";
import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { TubeGeometry, Vector3, CatmullRomCurve3 } from 'three';

extend({ TubeGeometry });

type ShotData = {
  landingPoint: { x: number; y: number };
  apexHeightMeters: number;
  curveMeters: number;
};

const YARDS_TO_SCENE_UNITS = 1;
const METERS_TO_SCENE_UNITS = YARDS_TO_SCENE_UNITS / 0.9144;

function calculateTrajectoryPoints(startPos: any, landingPos: any, apexHeight: number, curveAmount: number, numPoints = 50) {
  const midX = (startPos.x + landingPos.x) / 2;
  const midY = (startPos.y + landingPos.y) / 2;
  const midZ = apexHeight;
  const dirX = landingPos.x - startPos.x;
  const dirY = landingPos.y - startPos.y;
  const length = Math.max(1e-6, Math.sqrt(dirX * dirX + dirY * dirY));
  const perpX = -dirY / length;
  const perpY = dirX / length;
  const controlX = midX + perpX * curveAmount;
  const controlY = midY + perpY * curveAmount;
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(startPos.x, startPos.y, startPos.z || 0),
    new THREE.Vector3(controlX, controlY, midZ),
    new THREE.Vector3(landingPos.x, landingPos.y, landingPos.z || 0)
  );
  return curve.getPoints(numPoints);
}

function AnimatedShotLine({ shotData }: { shotData: ShotData }) {
  const tubeRef = useRef<THREE.Mesh>(null!);
  const tubeMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const curvePoints = useMemo(() => {
    if (!shotData) return null;
    const startPos = { x: 0, y: 0, z: 0 };
    const landingPos = {
      x: shotData.landingPoint.x * YARDS_TO_SCENE_UNITS,
      y: shotData.landingPoint.y * YARDS_TO_SCENE_UNITS,
      z: 0,
    };
    const apexHeight = shotData.apexHeightMeters * METERS_TO_SCENE_UNITS;
    const curveAmount = shotData.curveMeters * METERS_TO_SCENE_UNITS;
    return calculateTrajectoryPoints(startPos, landingPos, apexHeight, curveAmount);
  }, [shotData]);

  const tubeGeometry = useMemo(() => {
    if (!curvePoints) return null;
    const curve = new CatmullRomCurve3(curvePoints.map((p) => new Vector3(p.x, p.y, p.z)));
    return new TubeGeometry(curve, 64, 0.1, 8, false);
  }, [curvePoints]);

  const animProgress = useRef(0);
  const isAnimating = useRef(false);
  const animDuration = 1.5;

  useEffect(() => {
    if (shotData && tubeGeometry && tubeRef.current) {
      animProgress.current = 0;
      isAnimating.current = true;
      (tubeRef.current.geometry as any).setDrawRange(0, 0);
      tubeRef.current.visible = true;
      if (tubeMaterialRef.current) tubeMaterialRef.current.opacity = 1;
    }
  }, [shotData, tubeGeometry]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !tubeRef.current || !tubeGeometry) return;
    animProgress.current += delta / animDuration;
    if (animProgress.current >= 1) {
      animProgress.current = 1;
      isAnimating.current = false;
    }
    const totalVertices = (tubeGeometry as any).attributes.position.count;
    const drawEnd = Math.floor(totalVertices * animProgress.current);
    (tubeRef.current.geometry as any).setDrawRange(0, drawEnd);
    (tubeRef.current.geometry as any).attributes.position.needsUpdate = true;
  });

  if (!tubeGeometry) return null;

  return (
    <mesh ref={tubeRef as any} geometry={tubeGeometry as any} visible={false}>
      <meshStandardMaterial ref={tubeMaterialRef as any} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} transparent opacity={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Tracer({ shotData }: { shotData: ShotData | null }) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, pointerEvents: 'none' }} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 5, 100], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 10, 5]} intensity={1} />
      {shotData && <AnimatedShotLine shotData={shotData} />}
    </Canvas>
  );
}


