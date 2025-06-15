import { createSignal, createContext, useContext, type Component, type ParentProps } from 'solid-js';
import { type GameState, type Scene, type Choice, type Progress } from '../types';

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

// State interface
interface GameStateStore {
  gameState: () => GameState;
  setGameState: (value: GameState | ((prev: GameState) => GameState)) => void;
  createNewGame: (name?: string) => void;
  loadGame: (savedGameState: GameState) => void;
  addPlayerChoice: (choice: Choice) => void;
  updateProgress: (updates: Partial<Progress>) => void;
  setCurrentScene: (scene: Scene) => void;
  autoSaveEnabled: () => boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

// Create context
const GameStateContext = createContext<GameStateStore>();

// Provider component
export const GameStateProvider: Component<ParentProps> = (props) => {
  const [gameState, setGameState] = createSignal<GameState>(defaultGameState);
  const [autoSaveEnabled, setAutoSaveEnabled] = createSignal(true);

  const createNewGame = (name: string = 'New Game') => {
    const newGameState: GameState = {
      ...defaultGameState,
      id: generateGameId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setGameState(newGameState);
  };

  const loadGame = (savedGameState: GameState) => {
    setGameState({
      ...savedGameState,
      updatedAt: new Date()
    });
  };

  const addPlayerChoice = (choice: Choice) => {
    setGameState(prev => ({
      ...prev,
      playerChoices: [...prev.playerChoices, choice],
      gameProgress: {
        ...prev.gameProgress,
        choicesMade: prev.gameProgress.choicesMade + 1
      },
      updatedAt: new Date()
    }));
  };

  const updateProgress = (updates: Partial<Progress>) => {
    setGameState(prev => ({
      ...prev,
      gameProgress: { ...prev.gameProgress, ...updates },
      updatedAt: new Date()
    }));
  };

  const setCurrentScene = (scene: Scene) => {
    setGameState(prev => ({
      ...prev,
      currentScene: scene,
      updatedAt: new Date()
    }));
  };

  const store: GameStateStore = {
    gameState,
    setGameState,
    createNewGame,
    loadGame,
    addPlayerChoice,
    updateProgress,
    setCurrentScene,
    autoSaveEnabled,
    setAutoSaveEnabled
  };

  return (
    <GameStateContext.Provider value={store}>
      {props.children}
    </GameStateContext.Provider>
  );
};

// Hook to use the state
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
};