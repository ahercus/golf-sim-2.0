"use client";
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Profile = {
  name: string;
  handicap: number;
  gender: 'male' | 'female' | 'non_binary';
  handedness: 'right' | 'left';
};

type Props = {
  onSubmit: (profileWithThread: Profile & { threadId: string | null }) => void;
  onGetCommentary: (profile: Profile) => Promise<{ threadId: string | null; commentary: string } | null>;
  defaultHandicap?: number;
};

export default function WelcomeScreen({ onSubmit, onGetCommentary, defaultHandicap }: Props) {
  const [name, setName] = useState<string>('');
  const [handicap, setHandicap] = useState<number | ''>(
    defaultHandicap !== undefined ? defaultHandicap : 18
  );
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary'>('female');
  const [handedness, setHandedness] = useState<'right' | 'left'>('right');

  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [fetchedThreadId, setFetchedThreadId] = useState<string | null>(null);

  const handleGetAnnouncer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingCommentary(true);
    setCommentary(null);
    setFetchedThreadId(null);
    const profile: Profile = {
      name: name || 'Player',
      handicap: handicap === '' ? 18 : Math.max(0, Math.min(36, Number(handicap) || 0)),
      gender,
      handedness,
    };
    try {
      const result = await onGetCommentary(profile);
      if (result) {
        setCommentary(result.commentary);
        setFetchedThreadId(result.threadId);
      } else {
        setCommentary('Welcome! Announcer connection failed, but ready to play.');
      }
    } catch (err) {
      setCommentary(`Welcome ${profile.name}! Announcer error.`);
    } finally {
      setIsLoadingCommentary(false);
    }
  };

  const handleStartGame = () => {
    const profile: Profile = {
      name: name || 'Player',
      handicap: handicap === '' ? 18 : Math.max(0, Math.min(36, Number(handicap) || 0)),
      gender,
      handedness,
    };
    onSubmit({ ...profile, threadId: fetchedThreadId });
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/welcome-background.jpg')" }}
    >
      <div className="w-full max-w-md rounded-lg bg-white/90 backdrop-blur shadow-xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">Welcome to Pebble Beach Sim</h1>

        {!commentary && !isLoadingCommentary && (
          <form onSubmit={handleGetAnnouncer} className="space-y-4">
            <p className="text-sm text-gray-600">Please enter your details to get started:</p>

            <div className="space-y-2">
              <Label htmlFor="playerName">Name</Label>
              <Input
                id="playerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerHandicap">Handicap</Label>
              <Input
                id="playerHandicap"
                type="number"
                value={handicap}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') setHandicap('');
                  else setHandicap(Math.max(0, Math.min(36, parseInt(v, 10) || 0)));
                }}
                min={0}
                max={36}
                placeholder="0-36"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerGender">Gender</Label>
              <select
                id="playerGender"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-Binary</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerHandedness">Handedness</Label>
              <select
                id="playerHandedness"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={handedness}
                onChange={(e) => setHandedness(e.target.value as any)}
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </div>

            <Button type="submit" className="w-full">Get Announcer Welcome</Button>
          </form>
        )}

        {isLoadingCommentary && (
          <div className="text-center text-gray-700">Contacting the announcer...</div>
        )}

        {commentary && !isLoadingCommentary && (
          <div className="space-y-4">
            <p className="text-center text-gray-800 italic">“{commentary}”</p>
            <Button onClick={handleStartGame} className="w-full">Go to 1st Tee</Button>
          </div>
        )}
      </div>
    </div>
  );
}


