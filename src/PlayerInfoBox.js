import React from 'react';
import './PlayerInfoBox.css'; 

// Helper function for ordinal suffix
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function PlayerInfoBox({
  playerName,
  holeNumber,
  holeYards, // Need yards for display
  holePar,
  shotNumber,
  currentScore // Now represents TOTAL round score relative to par
}) {

  // Score is already relative to par for the round
  const scoreRelativeToPar = currentScore;
  const scoreDisplay = scoreRelativeToPar > 0 ? `+${scoreRelativeToPar}` : (scoreRelativeToPar === 0 ? 'E' : `${scoreRelativeToPar}`);
  const courseName = "PEBBLE BEACH"; // Or Augusta? Let's use Pebble for consistency with data
  const cutLine = "+3"; // Example, this would need data

  // Generate shot circles based on Par
  const renderShotCircles = () => {
    const circles = [];
    for (let i = 1; i <= holePar; i++) {
      circles.push(
        <div 
          key={i} 
          className={`shot-circle ${shotNumber === i ? 'active' : ''}`}
        >
          {i}
        </div>
      );
    }
    // Add extra circle if shotNumber exceeds par
    if (shotNumber > holePar) {
        circles.push(
            <div 
              key={shotNumber} 
              className={`shot-circle active`}
            >
              {shotNumber}
            </div>
          );
    }
    return circles;
  };

  return (
    <div className="player-info-box">
      <div className="course-name">{courseName}</div>
      <div className="player-name-container">
        <span className="player-name">{playerName.toUpperCase()}</span>
      </div>
      <div className="hole-details">
        <span className="detail-item">{holeNumber}{getOrdinalSuffix(holeNumber)}</span>
        <span className="detail-item">{holeYards} YDS</span>
        {/* Render shot circles */}        <div className="shot-number-display">
          {renderShotCircles()}
        </div>
      </div>
      <div className="score-display">{scoreDisplay}</div>
      {/* <div className="cut-line">CUT LINE: {cutLine}</div> */}
    </div>
  );
}

export default PlayerInfoBox; 