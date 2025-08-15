import React, { useState } from 'react';
import { ClipboardList, Target, Hand, Settings } from 'lucide-react';
import GolfGame from './GolfGame';
import Scorecard from './Scorecard';
import WelcomeScreen from './WelcomeScreen';
import { HoleMetadata } from './courseData/HoleMetadata.js';
import { createThread, createThreadMessage, createRun, fetchAssistantMessage } from './utils/openaiUtils';
import './App.css';

// Initialize scores state with null for each hole
const initialScores = {};
for (let i = 1; i <= 18; i++) {
  initialScores[i] = null;
}

// REMOVED: Function to get introductory commentary (moved into handleGetCommentary)
// async function getInitialCommentary(threadId, profileData) { ... }

function App() {
  // --- State --- //
  const [selectedHole, setSelectedHole] = useState(1);
  const [scores, setScores] = useState(initialScores);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [playerName, setPlayerName] = useState("Player");
  const [playerHandicap, setPlayerHandicap] = useState(18);
  const [playerGender, setPlayerGender] = useState("female");
  const [playerHandedness, setPlayerHandedness] = useState("right");
  const [isLoading, setIsLoading] = useState(false); // Keep for potential future use?
  const [threadId, setThreadId] = useState(null);
  // State for Settings within Scorecard Modal
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState("");
  const [tempPlayerGender, setTempPlayerGender] = useState("");
  const [aimMode, setAimMode] = useState(false); // Default to drag mode (false)

  // --- Handlers --- //
  const handleHoleChange = (event) => {
    setSelectedHole(parseInt(event.target.value, 10));
  };

  const handleHoleComplete = (holeNumber, finalScore) => {
    console.log(`Hole ${holeNumber} completed with score: ${finalScore}`);
    setScores(prevScores => ({
      ...prevScores,
      [holeNumber]: finalScore
    }));
    // Maybe show scorecard automatically after hole completion?
    // setShowScorecard(true);
  };

  const toggleScorecard = () => {
    setShowScorecard(!showScorecard);
  };

  // <<< NEW Handler to fetch commentary for WelcomeScreen >>>
  const handleGetCommentary = async (profileData) => {
    console.log("App: handleGetCommentary called with profile:", profileData);
    try {
        const newThread = await createThread();
        const threadId = newThread.id;
        console.log("App: Created OpenAI Thread:", threadId);

        const introContext = `
          Generate a brief (1-2 sentence) welcoming commentary for a golf simulation game in the style of Mike Tirico.

          Player Profile:
          - Name: ${profileData.name || 'Player'}
          - Handicap: ${profileData.handicap}
          - Gender: ${profileData.gender}
          - Handedness: ${profileData.handedness}

          Course: Pebble Beach Golf Links

          Task: Welcome the player to Pebble Beach, mentioning their name and perhaps acknowledging the challenge or beauty of the course based on general knowledge.
        `.trim();

        await createThreadMessage(threadId, 'user', introContext);
        await createRun(threadId);
        const commentary = await fetchAssistantMessage(threadId);
        console.log("App: Received commentary:", commentary);

        const welcomeMessage = commentary ? commentary.trim() : `Welcome ${profileData.name || 'Player'}! Let's get started at Pebble Beach.`;

        return { threadId, commentary: welcomeMessage }; // Return both
    } catch (error) {
        console.error("App: Error during initial commentary fetch:", error);
        const fallbackCommentary = `Welcome ${profileData.name || 'Player'}! Announcer connection failed.`;
        // Decide if we should return a threadId=null here or let it fail?
        // For now, return commentary but no threadId if thread creation failed.
        return { threadId: null, commentary: fallbackCommentary };
    }
  };

  // <<< Updated handler: Now receives profile AND threadId from WelcomeScreen >>>
  const handleProfileSubmit = (data) => {
    // data = { name, handicap, gender, handedness, threadId }
    setIsLoading(true); // Optional: maybe a very brief loading flash?
    setPlayerName(data.name || "Player");
    setPlayerHandicap(data.handicap === '' ? 18 : parseInt(data.handicap, 10));
    setPlayerGender(data.gender);
    setPlayerHandedness(data.handedness);
    setThreadId(data.threadId); // <<< Store the threadId passed from WelcomeScreen
    console.log("App: Final Profile Submit Received:", data);

    // No commentary fetch here anymore
    setIsProfileSet(true); // Show game screen
    setIsLoading(false);
  };

  // --- Settings Handlers ---
  const openSettings = () => {
    setTempPlayerName(playerName); // Load current settings into temp state
    setTempPlayerGender(playerGender);
    setShowSettingsView(true);
  };

  const closeSettings = () => {
    setShowSettingsView(false);
    // Optionally clear temp state, though it will be overwritten on next open
  };

  const handleTempNameChange = (event) => {
    setTempPlayerName(event.target.value);
  };

  const handleTempGenderChange = (event) => {
    setTempPlayerGender(event.target.value);
  };

  const saveSettings = () => {
    console.log("Saving settings:", { name: tempPlayerName, gender: tempPlayerGender });
    setPlayerName(tempPlayerName || "Player"); // Update actual player state
    setPlayerGender(tempPlayerGender);
    // Persist these changes? If so, add localStorage or API call here.
    closeSettings();
  };

  const restartMatch = () => {
    console.log("Restarting match...");
    setScores(initialScores); // Reset scores
    setSelectedHole(1);       // Go back to hole 1
    setShowScorecard(false);  // Close scorecard modal
    setShowSettingsView(false); // Ensure settings view is closed
    // We might need to re-trigger GolfGame's useEffect hooks, 
    // changing selectedHole should handle this via the key prop on GolfGame.
    // Do we reset the commentary thread? Let's keep it for now.
  };

  const confirmRestartMatch = () => {
    if (window.confirm("Are you sure you want to restart the match? All progress will be lost.")) {
      restartMatch();
    }
  };

  // --- Render --- //

  // if (isLoading) { ... } // Removed simple loading overlay, handled in WelcomeScreen

  if (!isProfileSet) {
    // Pass BOTH handlers to WelcomeScreen
    return (
        <WelcomeScreen
            onSubmit={handleProfileSubmit}
            onGetCommentary={handleGetCommentary}
            defaultHandicap={playerHandicap}
        />
    );
  }

  return (
    <div className="App">
      {/* Header for Hole Selection */}
      <div className="controls-header">
        {/* <<< REMOVED Hole Selection >>> */}
        {/* 
        <label htmlFor="hole-select">Select Hole: </label>
        <select id="hole-select" value={selectedHole} onChange={handleHoleChange}>
          {[...Array(18).keys()].map(num => (
            <option key={num + 1} value={num + 1}>
              Hole {num + 1}
            </option>
          ))}
        </select>
        */}
        <span style={{ marginLeft: '20px' }}>Player: {playerName} (Hcp: {playerHandicap})</span>
      </div>

      {/* Main Game Content Area */}
      <div className="main-content">
        {selectedHole && (
            <GolfGame
                key={selectedHole}
                holeNumber={selectedHole}
                onHoleComplete={handleHoleComplete}
                playerName={playerName}
                playerHandicap={playerHandicap}
                playerGender={playerGender}
                playerHandedness={playerHandedness}
                threadId={threadId}
                aimMode={aimMode}
                allScores={scores}
            />
        )}
      </div>

      {/* Scorecard toggle button */}
      <button 
        className="scorecard-button"
        onClick={toggleScorecard}
        aria-label="Toggle Scorecard"
      >
        <ClipboardList size={28} aria-hidden="true" />
      </button>

      {/* Game control buttons */}
      <button 
        className="aim-button"
        data-active={aimMode ? "true" : "false"}
        onClick={() => setAimMode(true)}
        aria-label="Toggle Aim Mode"
      >
        <Target size={28} aria-hidden="true" />
      </button>
      
      <button 
        className="drag-button"
        data-active={!aimMode ? "true" : "false"}
        onClick={() => setAimMode(false)}
        aria-label="Toggle Map Movement"
      >
        <Hand size={28} aria-hidden="true" />
      </button>

      {/* Scorecard Modal */}
      {showScorecard && (
        <div className="scorecard-modal-overlay" onClick={toggleScorecard}>
          <div className="scorecard-modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={toggleScorecard} className="scorecard-close-button">&times;</button>

            {/* Conditional Rendering: Settings or Scorecard */}
            {showSettingsView ? (
              // <<< Settings View >>>
              <div className="settings-view">
                <h2>Settings</h2>
                <div className="form-group">
                  <label htmlFor="settingsPlayerName">Name:</label>
                  <input
                    type="text"
                    id="settingsPlayerName"
                    value={tempPlayerName}
                    onChange={handleTempNameChange}
                    placeholder="Enter your name"
                    maxLength={30}
                    className="settings-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settingsPlayerGender">Gender:</label>
                  <select
                    id="settingsPlayerGender"
                    value={tempPlayerGender}
                    onChange={handleTempGenderChange}
                    className="settings-input"
                  > 
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-Binary</option>
                  </select>
                </div>
                <div className="settings-actions">
                  <button onClick={saveSettings} className="settings-button save">Save</button>
                  <button onClick={closeSettings} className="settings-button cancel">Cancel</button>
                  <button onClick={confirmRestartMatch} className="settings-button restart">Restart Match</button>
                </div>
              </div>
            ) : (
              // <<< Scorecard View >>>
              <>
                {/* Settings Toggle Button (Show only in Scorecard view) */}
                <button 
                  onClick={openSettings}
                  className="settings-toggle-button" 
                  title="Settings"
                >
                  <Settings size={20} aria-hidden="true" />
                </button>
                <Scorecard
                  scores={scores}
                  holeMetadata={HoleMetadata}
                  playerHandicap={playerHandicap}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
