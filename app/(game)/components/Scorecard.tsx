"use client";
import React from 'react';

type Scores = Record<number, number | null>;

type Props = {
  scores: Scores;
  playerHandicap: number;
};

// Hole metadata for par values
const HoleMetadata = {
  1: { par: 4, yards: 344 },
  2: { par: 5, yards: 509 },
  3: { par: 4, yards: 384 },
  4: { par: 4, yards: 308 },
  5: { par: 3, yards: 187 },
  6: { par: 5, yards: 496 },
  7: { par: 3, yards: 107 },
  8: { par: 4, yards: 395 },
  9: { par: 4, yards: 437 },
  10: { par: 4, yards: 429 },
  11: { par: 4, yards: 367 },
  12: { par: 3, yards: 173 },
  13: { par: 4, yards: 391 },
  14: { par: 5, yards: 542 },
  15: { par: 4, yards: 376 },
  16: { par: 4, yards: 374 },
  17: { par: 3, yards: 175 },
  18: { par: 5, yards: 515 },
};

export default function Scorecard({ scores, playerHandicap }: Props) {
  // Calculate totals
  const calculateOut = () => {
    let totalScore = 0;
    let totalPar = 0;
    for (let i = 1; i <= 9; i++) {
      if (scores[i] !== null) totalScore += scores[i]!;
      totalPar += HoleMetadata[i as keyof typeof HoleMetadata].par;
    }
    return { score: totalScore || 0, par: totalPar };
  };

  const calculateIn = () => {
    let totalScore = 0;
    let totalPar = 0;
    for (let i = 10; i <= 18; i++) {
      if (scores[i] !== null) totalScore += scores[i]!;
      totalPar += HoleMetadata[i as keyof typeof HoleMetadata].par;
    }
    return { score: totalScore || 0, par: totalPar };
  };

  const calculateTotal = () => {
    const out = calculateOut();
    const inScore = calculateIn();
    return {
      score: out.score + inScore.score,
      par: out.par + inScore.par
    };
  };

  const out = calculateOut();
  const inScore = calculateIn();
  const total = calculateTotal();

  return (
    <div className="text-center w-full max-w-full overflow-x-auto pb-2">
      <h2 className="mb-4 text-[#006747] text-2xl font-normal border-b border-[#FFD700] pb-1">
        Pebble Beach Golf Links
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse mx-auto text-sm font-sans">
          <thead>
            <tr>
              <th className="border border-gray-300 p-1 text-left font-bold bg-[#e9ecef] text-[#1a1a1a] sticky left-0 z-10 min-w-[100px]">
                Hole
              </th>
              {[1,2,3,4,5,6,7,8,9].map(hole => (
                <th key={hole} className="border border-[#FFD700] p-1 bg-[#006747] text-white font-bold text-center whitespace-nowrap">
                  {hole}
                </th>
              ))}
              <th className="border border-[#FFD700] p-1 bg-[#004d35] text-[#FFD700] font-bold text-center whitespace-nowrap border-l-2 border-r-2 border-gray-400">
                OUT
              </th>
              {[10,11,12,13,14,15,16,17,18].map(hole => (
                <th key={hole} className="border border-[#FFD700] p-1 bg-[#006747] text-white font-bold text-center whitespace-nowrap">
                  {hole}
                </th>
              ))}
              <th className="border border-[#FFD700] p-1 bg-[#004d35] text-[#FFD700] font-bold text-center whitespace-nowrap border-l-2 border-r-2 border-gray-400">
                IN
              </th>
              <th className="border border-[#FFD700] p-1 bg-[#004d35] text-[#FFD700] font-bold text-center whitespace-nowrap border-l-2 border-r-2 border-gray-400">
                TOT
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Par Row */}
            <tr>
              <td className="border border-gray-300 p-1 text-left font-bold bg-[#e9ecef] text-[#1a1a1a] sticky left-0 z-10">
                Par
              </td>
              {[1,2,3,4,5,6,7,8,9].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {HoleMetadata[hole as keyof typeof HoleMetadata].par}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {out.par}
              </td>
              {[10,11,12,13,14,15,16,17,18].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {HoleMetadata[hole as keyof typeof HoleMetadata].par}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {inScore.par}
              </td>
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {total.par}
              </td>
            </tr>

            {/* Yards Row */}
            <tr>
              <td className="border border-gray-300 p-1 text-left font-bold bg-[#e9ecef] text-[#1a1a1a] sticky left-0 z-10">
                Yards
              </td>
              {[1,2,3,4,5,6,7,8,9].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {HoleMetadata[hole as keyof typeof HoleMetadata].yards}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {[1,2,3,4,5,6,7,8,9].reduce((sum, h) => sum + HoleMetadata[h as keyof typeof HoleMetadata].yards, 0)}
              </td>
              {[10,11,12,13,14,15,16,17,18].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {HoleMetadata[hole as keyof typeof HoleMetadata].yards}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {[10,11,12,13,14,15,16,17,18].reduce((sum, h) => sum + HoleMetadata[h as keyof typeof HoleMetadata].yards, 0)}
              </td>
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {Object.values(HoleMetadata).reduce((sum, h) => sum + h.yards, 0)}
              </td>
            </tr>

            {/* Score Row */}
            <tr>
              <td className="border border-gray-300 p-1 text-left font-bold bg-[#e9ecef] text-[#1a1a1a] sticky left-0 z-10">
                Score
              </td>
              {[1,2,3,4,5,6,7,8,9].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {scores[hole] !== null ? scores[hole] : '-'}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {out.score || '-'}
              </td>
              {[10,11,12,13,14,15,16,17,18].map(hole => (
                <td key={hole} className="border border-gray-300 p-1 text-center whitespace-nowrap">
                  {scores[hole] !== null ? scores[hole] : '-'}
                </td>
              ))}
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {inScore.score || '-'}
              </td>
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100 border-l-2 border-r-2 border-gray-400">
                {total.score || '-'}
              </td>
            </tr>

            {/* Handicap Row */}
            <tr>
              <td className="border border-gray-300 p-1 text-left font-bold bg-[#e9ecef] text-[#1a1a1a] sticky left-0 z-10">
                Handicap
              </td>
              <td colSpan={21} className="border border-gray-300 p-1 text-center">
                {playerHandicap}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
