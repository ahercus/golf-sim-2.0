"use client";
import React, { useState } from 'react';
import { ClipboardList, Target, Hand, Settings } from 'lucide-react';
import { useGameStore } from '@/features/golf/state/useGameStore';
import WelcomeScreen from './components/WelcomeScreen';
import GolfGame from '@/src/GolfGame';
import Scorecard from '@/src/Scorecard';

export default function GamePage() {
  const { player, scores, selectedHole, aimMode, setAimMode } = useGameStore();
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showSettingsView, setShowSettingsView] = useState(false);

  const handleProfileComplete = (profileData: any) => {
    setIsProfileSet(true);
  };

  const handleHoleComplete = (holeNum: number, score: number) => {
    console.log(`Hole ${holeNum} completed with score ${score}`);
  };

  const toggleScorecard = () => {
    setShowScorecard(!showScorecard);
    setShowSettingsView(false); // Close settings when toggling scorecard
  };

  if (!isProfileSet) {
    return <WelcomeScreen onProfileComplete={handleProfileComplete} />;
  }

  return (
    <div className="App">
      {/* Header for Player Info */}
      <div className="bg-[#006747] text-white px-5 py-2 flex items-center border-b-2 border-[#FFD700] flex-shrink-0 text-sm">
        <span className="ml-auto font-bold">
          Player: {player.name} (Hcp: {player.handicap})
        </span>
      </div>

      {/* Main Game Content Area */}
      <div className="flex-grow flex min-h-0">
        <GolfGame
          key={selectedHole}
          holeNumber={selectedHole}
          scores={scores}
          playerName={player.name}
          playerHandicap={player.handicap}
          playerGender={player.gender}
          playerHandedness={player.handedness}
          onHoleComplete={handleHoleComplete}
          aimMode={aimMode}
          allScores={scores}
        />
      </div>

      {/* Scorecard toggle button */}
      <button 
        className="fixed bottom-5 right-5 w-15 h-15 rounded-full bg-[#006747] text-white border-none cursor-pointer shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-center text-2xl z-[1000] transition-all duration-200 hover:scale-110 hover:bg-[#006747] active:scale-95"
        onClick={toggleScorecard}
        aria-label="Toggle Scorecard"
      >
        <ClipboardList size={28} aria-hidden="true" />
      </button>

      {/* Game control buttons */}
      <button 
        className={`fixed bottom-5 left-[420px] w-15 h-15 rounded-full border-2 border-[#006747] cursor-pointer shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl z-[1000] transition-all duration-200 hover:scale-110 ${
          aimMode ? 'bg-[#006747] text-white' : 'bg-white text-[#006747]'
        }`}
        onClick={() => setAimMode(true)}
        aria-label="Toggle Aim Mode"
      >
        <Target size={28} aria-hidden="true" />
      </button>
      
      <button 
        className={`fixed bottom-5 left-[490px] w-15 h-15 rounded-full border-2 border-[#006747] cursor-pointer shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl z-[1000] transition-all duration-200 hover:scale-110 ${
          !aimMode ? 'bg-[#006747] text-white' : 'bg-white text-[#006747]'
        }`}
        onClick={() => setAimMode(false)}
        aria-label="Toggle Map Movement"
      >
        <Hand size={28} aria-hidden="true" />
      </button>

      {/* Scorecard Modal */}
      {showScorecard && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-[1000]" 
          onClick={toggleScorecard}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={toggleScorecard} 
              className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-gray-800 cursor-pointer bg-none border-none"
            >
              &times;
            </button>

            {showSettingsView ? (
              // Settings View
              <div className="settings-view">
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name:</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Enter your name"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender:</label>
                    <select className="w-full p-2 border border-gray-300 rounded">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-Binary</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                    <button 
                      onClick={() => setShowSettingsView(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Restart Match</button>
                  </div>
                </div>
              </div>
            ) : (
              // Scorecard View
              <>
                <button 
                  onClick={() => setShowSettingsView(true)}
                  className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-800 cursor-pointer bg-none border-none" 
                  title="Settings"
                >
                  <Settings size={20} aria-hidden="true" />
                </button>
                <Scorecard
                  scores={scores}
                  playerHandicap={player.handicap}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


