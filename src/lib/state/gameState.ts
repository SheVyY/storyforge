import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type GameState, type Scene, type Choice, type Progress, type DifficultyLevel, type EntityState, type Interaction, type Decision } from '../../types';

// Generate unique game ID
const generateGameId = () => `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default game state
const defaultGameState: GameState = {
  id: generateGameId(),
  name: 'New Game',
  currentScene: {
    id: 'intro-1',
    title: 'New Adventure',
    content: '',
    choices: [],
    entities: [],
    metadata: {
      genre: 'fantasy',
      tone: 'adventurous',
      themes: ['discovery'],
      estimatedReadTime: 1
    }
  },
  playerChoices: [],
  gameProgress: {
    scenesVisited: 0,
    choicesMade: 0,
    achievementsUnlocked: [],
    playtimeMinutes: 0
  },
  difficulty: 'normal',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Core game state atom
export const gameStateAtom = atom<GameState>(defaultGameState);

// Current scene atom (derived from game state)
export const currentSceneAtom = atom(
  (get) => get(gameStateAtom).currentScene,
  (get, set, newScene: Scene) => {
    const gameState = get(gameStateAtom);
    set(gameStateAtom, {
      ...gameState,
      currentScene: newScene,
      updatedAt: new Date()
    });
  }
);

// Player choices history
export const playerChoicesAtom = atom(
  (get) => get(gameStateAtom).playerChoices,
  (get, set, newChoice: Choice) => {
    const gameState = get(gameStateAtom);
    const updatedChoices = [...gameState.playerChoices, newChoice];
    const updatedProgress = {
      ...gameState.gameProgress,
      choicesMade: gameState.gameProgress.choicesMade + 1
    };
    
    set(gameStateAtom, {
      ...gameState,
      playerChoices: updatedChoices,
      gameProgress: updatedProgress,
      updatedAt: new Date()
    });
  }
);

// Game progress atom
export const gameProgressAtom = atom(
  (get) => get(gameStateAtom).gameProgress,
  (get, set, updates: Partial<Progress>) => {
    const gameState = get(gameStateAtom);
    set(gameStateAtom, {
      ...gameState,
      gameProgress: { ...gameState.gameProgress, ...updates },
      updatedAt: new Date()
    });
  }
);

// Entity state management
export const entityStatesAtom = atom<Map<string, EntityState>>(new Map());

// Narrative context for future AI integration
export const narrativeContextAtom = atom({
  recentHistory: [] as Interaction[],
  summaryBuffer: '',
  entityMemory: [] as EntityState[],
  choiceHistory: [] as Decision[]
});

// Settings atoms with localStorage persistence
export const difficultyAtom = atomWithStorage<DifficultyLevel>('storyforge-difficulty', 'normal');
export const autoSaveEnabledAtom = atomWithStorage('storyforge-autosave', true);
export const soundEnabledAtom = atomWithStorage('storyforge-sound', true);

// Session tracking
export const sessionStartTimeAtom = atom(Date.now());
export const totalPlaytimeAtom = atom((get) => {
  const sessionStart = get(sessionStartTimeAtom);
  const gameProgress = get(gameProgressAtom);
  const sessionMinutes = Math.floor((Date.now() - sessionStart) / 60000);
  return gameProgress.playtimeMinutes + sessionMinutes;
});

// Actions
export const createNewGameAtom = atom(
  null,
  (_, set, name: string = 'New Game') => {
    const newGameState: GameState = {
      ...defaultGameState,
      id: generateGameId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    set(gameStateAtom, newGameState);
    set(entityStatesAtom, new Map());
    set(narrativeContextAtom, {
      recentHistory: [],
      summaryBuffer: '',
      entityMemory: [],
      choiceHistory: []
    });
  }
);

export const loadGameAtom = atom(
  null,
  (_, set, savedGameState: GameState) => {
    set(gameStateAtom, {
      ...savedGameState,
      updatedAt: new Date()
    });
    // Reset session timer
    set(sessionStartTimeAtom, Date.now());
  }
);

// Utility atoms
export const isGameInProgressAtom = atom(
  (get) => get(gameStateAtom).playerChoices.length > 0
);

export const currentGameNameAtom = atom(
  (get) => get(gameStateAtom).name,
  (get, set, newName: string) => {
    const gameState = get(gameStateAtom);
    set(gameStateAtom, {
      ...gameState,
      name: newName,
      updatedAt: new Date()
    });
  }
);