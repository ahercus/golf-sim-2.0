"use client";
import React from 'react';

type Props = {
  playerName: string;
  holeNumber: number;
  holeYards: number;
  holePar: number;
  shotNumber: number;
  currentScore: number; // round score relative to par
};

function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"] as const;
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function PlayerInfoBox({ playerName, holeNumber, holeYards, holePar, shotNumber, currentScore }: Props) {
  const scoreDisplay = currentScore > 0 ? `+${currentScore}` : currentScore === 0 ? 'E' : `${currentScore}`;
  return (
    <div className="absolute top-4 left-4 z-20 rounded-lg bg-white/85 backdrop-blur shadow p-3 w-[300px]">
      <div className="text-xs tracking-wide text-gray-600">PEBBLE BEACH</div>
      <div className="mt-1 text-xl font-semibold tracking-wide">{playerName.toUpperCase()}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{holeNumber}{getOrdinalSuffix(holeNumber)}</span>
          <span className="text-sm text-gray-600">{holeYards} YDS</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(holePar, shotNumber) }).map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${i+1 === shotNumber ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-700 border-gray-300'}`}>{i+1}</div>
            ))}
          </div>
        </div>
        <div className="text-lg font-semibold">{scoreDisplay}</div>
      </div>
    </div>
  );
}


