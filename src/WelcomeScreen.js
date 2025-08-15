import React, { useState } from 'react';
import './WelcomeScreen.css'; // Make sure this CSS file exists and is styled
import welcomeBg from './assets/welcome-background.jpg'; // Import from src/assets

function WelcomeScreen({ onSubmit, onGetCommentary, defaultHandicap }) {
  const [name, setName] = useState('');
  // Use the defaultHandicap passed from App.js, or fallback to 18
  const [handicap, setHandicap] = useState(defaultHandicap !== undefined ? defaultHandicap : 18);
  const [gender, setGender] = useState('female'); // Default to 'female'
  const [handedness, setHandedness] = useState('right');

  // State for commentary flow
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [commentary, setCommentary] = useState(null);
  const [fetchedThreadId, setFetchedThreadId] = useState(null);

  // Renamed: Handles getting commentary first
  const handleGetAnnouncer = async (event) => {
    event.preventDefault();
    setIsLoadingCommentary(true);
    setCommentary(null); // Clear previous commentary
    setFetchedThreadId(null);
    const profileData = { name, handicap: handicap === '' ? 18 : parseInt(handicap, 10), gender, handedness };

    try {
      // Call the async function passed from App.js
      const result = await onGetCommentary(profileData);
      if (result) {
        setCommentary(result.commentary);
        setFetchedThreadId(result.threadId);
      } else {
        // Handle case where commentary fetch failed but we might want default text
        setCommentary("Welcome! Announcer connection failed, but ready to play.");
      }
    } catch (error) {
        console.error("Error during get commentary call:", error);
        setCommentary(`Welcome ${profileData.name || 'Player'}! Announcer error.`);
    } finally {
        setIsLoadingCommentary(false);
    }
  };

  // Called by the second button after commentary is shown
  const handleStartGame = () => {
     const profileData = { name, handicap: handicap === '' ? 18 : parseInt(handicap, 10), gender, handedness };
     // Pass profile data AND the threadId back to App.js
     onSubmit({ ...profileData, threadId: fetchedThreadId });
  }

  return (
    <div 
      className="welcome-container"
      style={{ backgroundImage: `url(${welcomeBg})` }}
    >
      <div className="welcome-card">
        <h1>Welcome to Pebble Beach Sim</h1>

        {/* Show Form OR Commentary/Start Button */}        {!commentary && !isLoadingCommentary && (
          <form onSubmit={handleGetAnnouncer}>
            <p>Please enter your details to get started:</p>
            {/* Name Input */}
            <div className="form-group">
              <label htmlFor="playerName">Name:</label>
              <input
                type="text"
                id="playerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
                required // Make name required?
              />
            </div>
            {/* Handicap Input */}
            <div className="form-group">
              <label htmlFor="playerHandicap">Handicap:</label>
              <input
                type="number"
                id="playerHandicap"
                value={handicap}
                // Allow empty input but default to 0 if parsed as NaN
                onChange={(e) => setHandicap(e.target.value === '' ? '' : Math.max(0, Math.min(36, parseInt(e.target.value, 10) || 0)))}
                min="0"
                max="36"
                placeholder="0-36"
              />
            </div>
            {/* Gender Select */}
            <div className="form-group">
              <label htmlFor="playerGender">Gender:</label>
              <select
                id="playerGender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              > 
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-Binary</option>
              </select>
            </div>
            {/* Handedness Select */}
            <div className="form-group">
              <label htmlFor="playerHandedness">Handedness:</label>
              <select
                id="playerHandedness"
                value={handedness}
                onChange={(e) => setHandedness(e.target.value)}
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </div>
            {/* Initial Submit Button */}
            <button type="submit" className="submit-button">
              Get Announcer Welcome
            </button>
          </form>
        )}

        {/* Loading Indicator */}        {isLoadingCommentary && (
          <div className="commentary-loading">
            <p>Contacting the announcer...</p>
            {/* Add a spinner or animation here if desired */}
          </div>
        )}

        {/* Commentary & Start Button */}        {commentary && !isLoadingCommentary && (
          <div className="commentary-display">
            <p className="announcer-text"><em>"{commentary}"</em></p>
            <button onClick={handleStartGame} className="submit-button start-game-button">
              Go to 1st Tee
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;
