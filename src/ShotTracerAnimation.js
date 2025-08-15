import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { TubeGeometry, Vector3, CatmullRomCurve3 } from 'three';

extend({ TubeGeometry });

// Constants (adjust scale as needed for your scene)
const YARDS_TO_SCENE_UNITS = 1; // Example: 1 yard = 1 scene unit
const METERS_TO_SCENE_UNITS = YARDS_TO_SCENE_UNITS / 0.9144;

// --- Helper: Calculate Trajectory Points ---
function calculateTrajectoryPoints(startPos, landingPos, apexHeight, curveAmount, numPoints = 50) {
    const points = [];
    const controlPointHeight = apexHeight * 1.5; // Control point higher than apex

    // Calculate midpoint for curve and height
    const midX = (startPos.x + landingPos.x) / 2;
    const midY = (startPos.y + landingPos.y) / 2;
    const midZ = apexHeight; // Apex height at the Z midpoint

    // Introduce curve by offsetting the midpoint perpendicular to the direction of the shot
    const dirX = landingPos.x - startPos.x;
    const dirY = landingPos.y - startPos.y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    const perpX = -dirY / length;
    const perpY = dirX / length;

    const controlX = midX + perpX * curveAmount;
    const controlY = midY + perpY * curveAmount;

    // Use QuadraticBezierCurve3 for simplicity initially
    // Could upgrade to CatmullRomCurve3 later for smoother, more complex paths
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startPos.x, startPos.y, startPos.z || 0),
        new THREE.Vector3(controlX, controlY, midZ), // Control point influences curve and height
        new THREE.Vector3(landingPos.x, landingPos.y, landingPos.z || 0)
    );

    return curve.getPoints(numPoints);
}

// --- Animated Tube Component ---
function AnimatedShotLine({ shotData }) {
    const tubeRef = useRef();
    const tubeMaterialRef = useRef();
    const curvePoints = useMemo(() => {
        if (!shotData) return null;

        // Convert simulation units (yards/meters) to scene units
        const startPos = { x: 0, y: 0, z: 0 }; // Assume ball starts at origin for now
        const landingPos = {
            x: shotData.landingPoint.x * YARDS_TO_SCENE_UNITS,
            y: shotData.landingPoint.y * YARDS_TO_SCENE_UNITS,
            z: 0 // Assume landing on flat ground for now
        };
        const apexHeight = shotData.apexHeightMeters * METERS_TO_SCENE_UNITS;
        const curveAmount = shotData.curveMeters * METERS_TO_SCENE_UNITS; // Adjust based on how curveMeters is defined

        return calculateTrajectoryPoints(startPos, landingPos, apexHeight, curveAmount);
    }, [shotData]);

    const tubeGeometry = useMemo(() => {
        if (!curvePoints) return null;
        const curve = new CatmullRomCurve3(curvePoints.map(p => new Vector3(p.x, p.y, p.z)));
        // Adjust tube radius, segments for appearance
        return new TubeGeometry(curve, 64, 0.1, 8, false);
    }, [curvePoints]);

    // Animation state
    const animProgress = useRef(0); // 0 to 1
    const isAnimating = useRef(false);
    const animDuration = 1.5; // seconds

    useEffect(() => {
        // Reset and start animation when shotData changes
        if (shotData && tubeGeometry) {
            animProgress.current = 0;
            isAnimating.current = true;
            if (tubeRef.current) {
                tubeRef.current.geometry.setDrawRange(0, 0);
                tubeRef.current.visible = true;
            }
            if (tubeMaterialRef.current) {
                tubeMaterialRef.current.opacity = 1.0;
            }
        }
    }, [shotData, tubeGeometry]);

    useFrame((state, delta) => {
        if (!isAnimating.current || !tubeRef.current || !tubeGeometry) return;

        animProgress.current += delta / animDuration;

        if (animProgress.current >= 1) {
            animProgress.current = 1;
            isAnimating.current = false;
             // Optionally fade out after completion
             // setTimeout(() => {
             //     if (tubeMaterialRef.current) tubeMaterialRef.current.opacity = 0;
             // }, 1000); // Fade after 1 second
        }

        const totalVertices = tubeGeometry.attributes.position.count;
        const drawEnd = Math.floor(totalVertices * animProgress.current);

        // Animate the drawing of the tube
        tubeRef.current.geometry.setDrawRange(0, drawEnd);
        tubeRef.current.geometry.attributes.position.needsUpdate = true; // Important!

        // Fade out near the end?
        // if (animProgress.current > 0.8 && tubeMaterialRef.current) {
        //     tubeMaterialRef.current.opacity = 1.0 - (animProgress.current - 0.8) / 0.2;
        // }
    });

    if (!tubeGeometry) return null;

    return (
        <mesh ref={tubeRef} geometry={tubeGeometry} visible={false}>
            <meshStandardMaterial
                ref={tubeMaterialRef}
                color="#ffffff" // White tracer
                emissive="#ffffff" // Make it glow slightly
                emissiveIntensity={1.5}
                transparent={true}
                opacity={1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// --- Main Tracer Component ---
function ShotTracerAnimation({ shotData, onAnimationComplete }) {
    // shotData comes from the simulation

    useEffect(() => {
        if (!shotData) return;
        // TODO: Trigger onAnimationComplete appropriately
        // Could use a timer based on animDuration, or pass a callback down
    }, [shotData, onAnimationComplete]);

    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, pointerEvents: 'none' }}
            gl={{ alpha: true, antialias: true }} // Transparent background
            camera={{ position: [0, 5, 100], fov: 50 }} // Adjust camera position/fov for best view
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 10, 5]} intensity={1} />

            {shotData && <AnimatedShotLine shotData={shotData} />}

            {/* Add ground plane, skybox, etc. if needed for context */}
            {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#557755" />
            </mesh> */}
        </Canvas>
    );
}

export default ShotTracerAnimation; 