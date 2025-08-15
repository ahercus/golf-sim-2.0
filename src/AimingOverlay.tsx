"use client";
import React from 'react';

type Point = { x: number; y: number };
type Props = {
  ballScreenPos?: Point | null;
  targetScreenPos?: Point | null;
  clampedTargetScreenPos?: Point | null;
  maxDistRadiusPx?: number;
  isDraggingAim: boolean;
  interactionMode: 'aim' | 'drag';
  currentDistance?: number;
  maxClubDistance?: number;
  isAimingOverMax: boolean;
  clampedDistance?: number;
};

const jiggleKeyframes = `
@keyframes jiggle { 0%,100%{transform:translate(0,0)}25%{transform:translate(1px,-1px)}50%{transform:translate(-1px,1px)}75%{transform:translate(1px,1px)} }
`;

export default function AimingOverlay({
  ballScreenPos,
  clampedTargetScreenPos,
  maxDistRadiusPx = 0,
  isDraggingAim,
  interactionMode,
  currentDistance = 0,
  maxClubDistance = 0,
  isAimingOverMax,
  clampedDistance = 0,
}: Props) {
  const jiggle = isAimingOverMax && isDraggingAim;
  if (!ballScreenPos || !clampedTargetScreenPos || typeof clampedTargetScreenPos.x === 'undefined') {
    return (
      <>
        <style>{jiggleKeyframes}</style>
        {null}
      </>
    );
  }
  const startX = ballScreenPos.x;
  const startY = ballScreenPos.y;
  const endX = clampedTargetScreenPos.x;
  const endY = clampedTargetScreenPos.y;
  const dx = endX - startX;
  const dy = endY - startY;
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  const distanceForGradient = isDraggingAim ? currentDistance : clampedDistance;
  const distRatio = Math.min(1, distanceForGradient / (maxClubDistance || 1));
  const hue = Math.max(0, 120 * (1 - distRatio));
  const finalColor = `hsl(${hue}, 90%, 60%)`;
  const lineGradientId = 'aimingGradient';
  const safeMax = Math.max(1, maxClubDistance || 1);
  const safeCurr = Math.max(0, currentDistance || 0);
  const arcOpacity = Math.min(1, Math.max(0, (safeCurr / safeMax) * 2 - 1));
  const arcExtent = Math.PI / 6;
  const arcStartAngle = angleRad - arcExtent / 2;
  const arcEndAngle = angleRad + arcExtent / 2;
  const arcGradientId = 'arcGradient';
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    if (!radius || radius <= 0) return '';
    const sx = x + radius * Math.cos(startAngle);
    const sy = y + radius * Math.sin(startAngle);
    const ex = x + radius * Math.cos(endAngle);
    const ey = y + radius * Math.sin(endAngle);
    const laf = endAngle - startAngle <= Math.PI ? '0' : '1';
    return ['M', sx, sy, 'A', radius, radius, 0, laf, '1', ex, ey].join(' ');
  };
  const arcPathData = describeArc(startX, startY, maxDistRadiusPx, arcStartAngle, arcEndAngle);
  return (
    <>
      <style>{jiggleKeyframes}</style>
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999, animation: jiggle ? 'jiggle 0.2s infinite linear' : 'none', transformOrigin: '50% 50%' }}
      >
        <defs>
          <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform={`rotate(${angleDeg}, 0, 0)`}>
            {isDraggingAim ? (
              <>
                <stop offset="0%" stopColor="hsl(120, 90%, 60%)" stopOpacity="0.7" />
                <stop offset="95%" stopColor={finalColor} stopOpacity="0.7" />
                <stop offset="100%" stopColor={finalColor} stopOpacity="0" />
              </>
            ) : (
              <stop offset="100%" stopColor={finalColor} stopOpacity="0.7" />
            )}
          </linearGradient>
          <linearGradient id={arcGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,80,80,0)" />
            <stop offset="15%" stopColor="rgba(255,80,80,0.7)" />
            <stop offset="85%" stopColor="rgba(255,80,80,0.7)" />
            <stop offset="100%" stopColor="rgba(255,80,80,0)" />
          </linearGradient>
        </defs>
        {typeof endX !== 'undefined' && typeof endY !== 'undefined' && interactionMode === 'aim' && isDraggingAim && maxDistRadiusPx > 0 && arcPathData && (
          <path d={arcPathData} fill="none" stroke={`url(#${arcGradientId})`} strokeWidth={3.5} strokeLinecap="round" style={{ opacity: arcOpacity, transition: 'opacity 0.2s ease-in-out' }} />
        )}
        {typeof endX !== 'undefined' && typeof endY !== 'undefined' && (
          <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={`url(#${lineGradientId})`} strokeWidth={8} strokeLinecap="round" />
        )}
      </svg>
    </>
  );
}


