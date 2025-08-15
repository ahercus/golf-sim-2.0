import { create } from 'zustand';

type Player = { name: string; handicap: number; gender: string; handedness: string };
type Scores = Record<number, number | null>;
type Wind = { speed: number; direction: number };

type GameState = {
  player: Player;
  scores: Scores;
  selectedHole: number;
  aimMode: boolean;
  wind: Wind;
  setPlayer: (p: Partial<Player>) => void;
  setScore: (hole: number, score: number | null) => void;
  setSelectedHole: (hole: number) => void;
  setAimMode: (aim: boolean) => void;
  setWind: (w: Partial<Wind>) => void;
};

const initialScores: Scores = Array.from({ length: 18 }).reduce((acc, _, idx) => {
  acc[idx + 1] = null;
  return acc;
}, {} as Scores);

export const useGameStore = create<GameState>((set) => ({
  player: { name: 'Player', handicap: 18, gender: 'female', handedness: 'right' },
  scores: initialScores,
  selectedHole: 1,
  aimMode: false,
  wind: { speed: 0, direction: 0 },
  setPlayer: (p) => set((s) => ({ player: { ...s.player, ...p } })),
  setScore: (hole, score) => set((s) => ({ scores: { ...s.scores, [hole]: score } })),
  setSelectedHole: (hole) => set({ selectedHole: hole }),
  setAimMode: (aim) => set({ aimMode: aim }),
  setWind: (w) => set((s) => ({ wind: { ...s.wind, ...w } })),
}));


