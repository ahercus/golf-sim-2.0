import React from 'react';

// Helper to calculate totals, now including handicap allocation
const calculateTotals = (scores, metadata, start, end, handicapStrokesPerHole) => {
  let totalScore = 0;
  let totalPar = 0;
  let totalHandicapStrokes = 0;
  let totalNetScore = 0;
  let holesPlayed = 0;

  for (let i = start; i <= end; i++) {
    const holeMeta = metadata[i];
    const holeScore = scores[i];
    const holeHcpStrokes = holeMeta ? handicapStrokesPerHole[i] || 0 : 0;

    totalPar += holeMeta?.par || 0;
    totalHandicapStrokes += holeHcpStrokes;

    if (holeScore !== null) {
      totalScore += holeScore;
      const netScore = holeScore - holeHcpStrokes;
      totalNetScore += netScore;
      holesPlayed++;
    }
  }

  // Calculate relative scores only if holes were played
  const scoreRelativeToPar = holesPlayed > 0 ? totalScore - totalPar : null;
  const netScoreRelativeToPar = holesPlayed > 0 ? totalNetScore - totalPar : null;

  return {
    totalScore,
    totalPar,
    totalHandicapStrokes,
    totalNetScore,
    scoreRelativeToPar,
    netScoreRelativeToPar,
    holesPlayed // Include holesPlayed for display logic
  };
};

// Simple handicap allocation based on hole index (a real system uses Hole Index 1-18)
// This is a placeholder - replace with actual Hole Index logic if available
const allocateHandicapStrokes = (playerHandicap, holeMetadata) => {
    const strokesPerHole = {};
    const numHoles = Object.keys(holeMetadata).length;
    if (numHoles === 0) return strokesPerHole;

    const baseStrokes = Math.floor(playerHandicap / numHoles);
    let remainingStrokes = playerHandicap % numHoles;

    // Assign base strokes to all holes
    for (const holeNum in holeMetadata) {
        strokesPerHole[holeNum] = baseStrokes;
    }

    // Distribute remaining strokes to the first 'remainingStrokes' holes
    // THIS IS A DUMMY ALLOCATION - Replace with real Hole Index lookup
    const sortedHoleNumbers = Object.keys(holeMetadata).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < remainingStrokes; i++) {
        const holeNum = sortedHoleNumbers[i];
        if (holeNum) {
             strokesPerHole[holeNum]++;
        }
    }

    return strokesPerHole;
};

function Scorecard({ scores, holeMetadata, playerHandicap }) {
  const holes = Object.keys(holeMetadata).map(Number);
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);

  // Calculate handicap strokes per hole
  const handicapStrokesPerHole = allocateHandicapStrokes(playerHandicap, holeMetadata);

  // Calculate totals including net scores
  const frontTotals = calculateTotals(scores, holeMetadata, 1, 9, handicapStrokesPerHole);
  const backTotals = calculateTotals(scores, holeMetadata, 10, 18, handicapStrokesPerHole);

  const grandTotalScore = frontTotals.totalScore + backTotals.totalScore;
  const grandTotalPar = frontTotals.totalPar + backTotals.totalPar;
  const grandTotalHandicap = frontTotals.totalHandicapStrokes + backTotals.totalHandicapStrokes;
  const grandTotalNetScore = frontTotals.totalNetScore + backTotals.totalNetScore;

  // Determine if any holes were played for relative score calculation
  const anyHolesPlayed = frontTotals.holesPlayed > 0 || backTotals.holesPlayed > 0;

  const grandRelativeToPar = anyHolesPlayed ? grandTotalScore - grandTotalPar : null;
  const grandNetRelativeToPar = anyHolesPlayed ? grandTotalNetScore - grandTotalPar : null;

  // --- Formatting Helpers ---
  const formatScore = (score) => (score === null || score === undefined ? '-' : score);

  // --- Helper to get CSS class based on score relative to par ---
  const getScoreClass = (grossScore, par) => {
    if (grossScore === null || par === null || par === undefined) return ''; // No score or par, no class
    const diff = grossScore - par;
    if (diff === -1) return 'birdie';      // Circle
    if (diff <= -2) return 'eagle';       // Double Circle
    if (diff === 1) return 'bogey';       // Square
    if (diff >= 2) return 'double-bogey'; // Double Square
    return ''; // Par or no score
  };

  return (
    <div className="scorecard">
      <h2>Scorecard - Pebble Beach (HCP: {playerHandicap})</h2>
      <table>
        <thead>
          <tr>
            <th>Hole</th>
            {frontNine.map(holeNum => <th key={holeNum}>{holeNum}</th>)}
            <th>OUT</th>
            {backNine.map(holeNum => <th key={holeNum}>{holeNum}</th>)}
            <th>IN</th>
            <th>TOT</th>
          </tr>
        </thead>
        <tbody>
          {/* Yardage Row */}
          <tr>
            <td>Yardage</td>
            {frontNine.map(holeNum => <td key={holeNum}>{holeMetadata[holeNum]?.yards || '-'}</td>)}
            <td>{/* Placeholder */}</td>
            {backNine.map(holeNum => <td key={holeNum}>{holeMetadata[holeNum]?.yards || '-'}</td>)}
            <td>{/* Placeholder */}</td>
            <td>{Object.values(holeMetadata).reduce((sum, h) => sum + (h?.yards || 0), 0)}</td>
          </tr>
          {/* Par Row */}
          <tr>
            <td>Par</td>
            {frontNine.map(holeNum => <td key={holeNum}>{holeMetadata[holeNum]?.par || '-'}</td>)}
            <td>{frontTotals.totalPar}</td>
            {backNine.map(holeNum => <td key={holeNum}>{holeMetadata[holeNum]?.par || '-'}</td>)}
            <td>{backTotals.totalPar}</td>
            <td>{grandTotalPar}</td>
          </tr>
          {/* Gross Score Row */}
          <tr style={{ fontWeight: 'bold' }}>
            <td>Score (Gross)</td>
            {frontNine.map(holeNum => {
                const gross = scores[holeNum];
                const par = holeMetadata[holeNum]?.par;
                const scoreClass = getScoreClass(gross, par);
                return (
                  <td key={`score-${holeNum}`} className={scoreClass}>
                    {formatScore(gross)}
                  </td>
                );
            })}
            <td>{formatScore(frontTotals.totalScore)}</td>
            {backNine.map(holeNum => {
                 const gross = scores[holeNum];
                 const par = holeMetadata[holeNum]?.par;
                 const scoreClass = getScoreClass(gross, par);
                 return (
                   <td key={`score-${holeNum}`} className={scoreClass}>
                     {formatScore(gross)}
                   </td>
                 );
            })}
            <td>{formatScore(backTotals.totalScore)}</td>
            <td>{formatScore(grandTotalScore)}</td>
          </tr>
          {/* Net Score Row */}
          <tr>
            <td>Score (Net)</td>
            {frontNine.map(holeNum => {
                const gross = scores[holeNum];
                const hcp = handicapStrokesPerHole[holeNum] || 0;
                const net = gross !== null ? gross - hcp : null;
                return <td key={`net-${holeNum}`}>{formatScore(net)}</td>;
            })}
            <td>{formatScore(frontTotals.totalNetScore)}</td>
            {backNine.map(holeNum => {
                 const gross = scores[holeNum];
                 const hcp = handicapStrokesPerHole[holeNum] || 0;
                 const net = gross !== null ? gross - hcp : null;
                 return <td key={`net-${holeNum}`}>{formatScore(net)}</td>;
            })}
            <td>{formatScore(backTotals.totalNetScore)}</td>
            <td>{formatScore(grandTotalNetScore)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Scorecard; 