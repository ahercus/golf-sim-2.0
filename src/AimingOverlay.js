import React, { useEffect, useState } from 'react';

// Add a CSS keyframe for the jiggle effect
const jiggleKeyframes = `
@keyframes jiggle {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  75% { transform: translate(1px, 1px); }
}
`;

function AimingOverlay({ 
    ballScreenPos, 
    targetScreenPos, // Raw screen position from mouse
    clampedTargetScreenPos, // CLAMPED position for max club distance
    maxDistRadiusPx,
    isDraggingAim, 
    interactionMode,
    currentDistance, // RAW distance to mouse target 
    maxClubDistance,
    isAimingOverMax, 
    clampedDistance // Clamped distance for static gradient
}) {
  // Jiggle state now directly reflects if aiming over max
  const jiggle = isAimingOverMax && isDraggingAim;

  // Render aiming elements ONLY if we have a target position
  if (!ballScreenPos || !clampedTargetScreenPos || typeof clampedTargetScreenPos.x === 'undefined') {
    return (
        <>
            <style>{jiggleKeyframes}</style>
            {null}
        </>
    )
  }

  const startX = ballScreenPos.x;
  const startY = ballScreenPos.y;
  
  // Always use the clamped position for the line endpoint
  const endX = clampedTargetScreenPos.x;
  const endY = clampedTargetScreenPos.y;

  // --- Straight Line & Gradient --- //
  const dx = endX - startX;
  const dy = endY - startY;
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * 180 / Math.PI;
  let lineLength = Math.sqrt(dx*dx + dy*dy); 

  // No stretch effect needed since we're always using clamped position
  
  // Calculate gradient based on CLAMPED distance when static, RAW distance when dragging
  const distanceForGradient = isDraggingAim ? (currentDistance || 0) : (clampedDistance || 0);
  const distRatio = Math.min(1, distanceForGradient / (maxClubDistance || 1));
  
  // Smooth HSL interpolation: Hue from 120 (green) down to 0 (red)
  const hue = Math.max(0, 120 * (1 - distRatio));
  const saturation = 90; // Keep saturation high
  const lightness = 60; // Keep lightness consistent
  const finalColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  const lineGradientId = "aimingGradient";

  // --- Max Distance Arc --- //
  const safeMaxClubDistance = Math.max(1, maxClubDistance || 1);
  const safeCurrentDistance = Math.max(0, currentDistance || 0);
  const arcOpacity = Math.min(1, Math.max(0, (safeCurrentDistance / safeMaxClubDistance) * 2 - 1)); 
  const arcExtent = Math.PI / 6; // <<< Shorten arc to 30 degrees
  const arcStartAngle = angleRad - arcExtent / 2;
  const arcEndAngle = angleRad + arcExtent / 2;
  const arcGradientId = "arcGradient"; // New gradient for arc

  const describeArc = (x, y, radius, startAngle, endAngle) => {
      if (!radius || radius <= 0) return ""; 
      const start = {
          x: x + radius * Math.cos(startAngle),
          y: y + radius * Math.sin(startAngle)
      };
      const end = {
          x: x + radius * Math.cos(endAngle),
          y: y + radius * Math.sin(endAngle)
      };
      const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
      const sweepFlag = "1";
      return [
          "M", start.x, start.y, 
          "A", radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
      ].join(" ");
  }

  const arcPathData = describeArc(startX, startY, maxDistRadiusPx, arcStartAngle, arcEndAngle);
  
  // Show aiming elements regardless of interaction mode - persist while toggling modes
  const showAimingElements = typeof endX !== 'undefined' && typeof endY !== 'undefined';

  // Only show max distance arc when in aiming mode and dragging
  const showArc = interactionMode === 'aim' && isDraggingAim;

  return (
    <>
      <style>{jiggleKeyframes}</style>
      <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999,
          animation: jiggle ? 'jiggle 0.2s infinite linear' : 'none', // Continuous jiggle
          transformOrigin: '50% 50%'
      }}>
        <defs>
          {/* Gradient for the aiming line */}
          <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%"
            gradientTransform={`rotate(${angleDeg}, 0, 0)`}> 
            {/* Use only two stops if NOT dragging (static line) */}
            {!isDraggingAim ? (
              <stop offset="100%" stopColor={finalColor} stopOpacity="0.7" />
            ) : (
              <>
                <stop offset="0%" stopColor="hsl(120, 90%, 60%)" stopOpacity="0.7" />{/* Always start green */}
                <stop offset="95%" stopColor={finalColor} stopOpacity="0.7" />
                <stop offset="100%" stopColor={finalColor} stopOpacity="0" />
              </>
            )}
          </linearGradient>

          {/* Gradient for the arc taper */}
          <linearGradient id={arcGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 80, 80, 0)" />
            <stop offset="15%" stopColor="rgba(255, 80, 80, 0.7)" />
            <stop offset="85%" stopColor="rgba(255, 80, 80, 0.7)" />
            <stop offset="100%" stopColor="rgba(255, 80, 80, 0)" />
          </linearGradient>
        </defs>

        {/* Max Distance Arc - Solid with Gradient Stroke */}        
        {showAimingElements && showArc && maxDistRadiusPx > 0 && arcPathData && (
            <path
                d={arcPathData}
                fill="none"
                stroke={`url(#${arcGradientId})`} 
                strokeWidth="3.5" 
                strokeLinecap="round"
                style={{ opacity: arcOpacity, transition: 'opacity 0.2s ease-in-out' }} 
            />
        )}

        {/* Aiming Line with Gradient */}        
        {showAimingElements && (
            <line
                x1={startX}
                y1={startY}
                x2={endX} 
                y2={endY}
                stroke={`url(#${lineGradientId})`}
                strokeWidth="8" 
                strokeLinecap="round"
            />
        )}

      </svg>
    </>
  );
}

export default AimingOverlay;
