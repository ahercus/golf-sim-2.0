"use client";
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClubSelect from './ClubSelect';
import ShotPlanInput from './ShotPlanInput';
import CommentaryPanel from './CommentaryPanel';
import { Button } from '@/components/ui/button';

type Message = { type: 'announcer' | 'user'; text: string };

type Props = {
  activeTab: 'shot' | 'commentary';
  onTabChange: (tab: 'shot' | 'commentary') => void;
  currentLie: string;
  distanceToPinYds?: number | null;
  wind: { speed: number; direction: number };
  club: string;
  onClubChange: (club: string) => void;
  clubOptions: string[];
  shotDescription: string;
  onShotDescriptionChange: (val: string) => void;
  onTakeShot: () => void;
  disableTakeShot: boolean;
  isLoading: boolean;
  messages: Message[];
  containerStyle?: React.CSSProperties;
  shotInfoStyle?: React.CSSProperties;
  messageContainerStyle?: React.CSSProperties;
};

export default function GolfSidebar({
  activeTab,
  onTabChange,
  currentLie,
  distanceToPinYds,
  wind,
  club,
  onClubChange,
  clubOptions,
  shotDescription,
  onShotDescriptionChange,
  onTakeShot,
  disableTakeShot,
  isLoading,
  messages,
  containerStyle,
  shotInfoStyle,
  messageContainerStyle,
}: Props) {
  return (
    <div style={containerStyle}>
      <Tabs value={activeTab} onValueChange={(val) => onTabChange(val as 'shot' | 'commentary')}>
        <TabsList className="sidebar-tabs">
          <TabsTrigger value="shot" className={`sidebar-tab-button ${activeTab === 'shot' ? 'active' : ''}`}>
            Shot Setup
          </TabsTrigger>
          <TabsTrigger value="commentary" className={`sidebar-tab-button ${activeTab === 'commentary' ? 'active' : ''}`}>
            Commentary
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="sidebar-tab-content">
        {activeTab === 'shot' && (
          <div className="shot-selection-content">
            <div style={shotInfoStyle}>
              <p>Current Lie: {currentLie}</p>
              <p>Distance to Pin: {typeof distanceToPinYds === 'number' ? Math.round(distanceToPinYds) : 'N/A'} yds</p>
              <p>Wind: {wind.speed.toFixed(1)} mph @ {wind.direction.toFixed(0)}°</p>
            </div>
            <div>
              <ClubSelect value={club} onChange={onClubChange} options={clubOptions} />
            </div>
            <ShotPlanInput value={shotDescription} onChange={onShotDescriptionChange} />
            <Button onClick={onTakeShot} disabled={disableTakeShot}>
              {isLoading ? 'Processing...' : 'Take Shot'}
            </Button>
          </div>
        )}

        {activeTab === 'commentary' && (
          <CommentaryPanel messages={messages} className="commentary-content" style={messageContainerStyle} />
        )}
      </div>
    </div>
  );
}


