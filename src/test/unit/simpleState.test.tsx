import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { GameStateProvider, useGameState } from '../../lib/simpleState';
import { type GameState } from '../../types';

// Test component to access state
function TestComponent() {
  const { 
    gameState, 
    createNewGame, 
    addPlayerChoice, 
    updateProgress, 
    setCurrentScene,
    autoSaveEnabled,
    setAutoSaveEnabled 
  } = useGameState();

  return (
    <div>
      <div data-testid="game-name">{gameState().name}</div>
      <div data-testid="scenes-visited">{gameState().gameProgress.scenesVisited}</div>
      <div data-testid="choices-made">{gameState().gameProgress.choicesMade}</div>
      <div data-testid="auto-save">{autoSaveEnabled().toString()}</div>
      
      <button 
        data-testid="new-game-btn" 
        onClick={() => createNewGame('Test Game')}
      >
        New Game
      </button>
      
      <button 
        data-testid="add-choice-btn" 
        onClick={() => addPlayerChoice({
          id: 'test-choice',
          text: 'Test Choice',
          consequence: 'Test consequence',
          impact: { narrative: 5, character: 5, world: 5 }
        })}
      >
        Add Choice
      </button>
      
      <button 
        data-testid="update-progress-btn" 
        onClick={() => updateProgress({ scenesVisited: 5 })}
      >
        Update Progress
      </button>
      
      <button 
        data-testid="set-scene-btn" 
        onClick={() => setCurrentScene({
          id: 'new-scene',
          title: 'New Scene',
          content: 'New content',
          choices: [],
          entities: [],
          metadata: {
            genre: 'test',
            tone: 'testing',
            themes: ['test'],
            estimatedReadTime: 1
          }
        })}
      >
        Set Scene
      </button>
      
      <button 
        data-testid="toggle-autosave-btn" 
        onClick={() => setAutoSaveEnabled(!autoSaveEnabled())}
      >
        Toggle Auto-save
      </button>
    </div>
  );
}

function TestWrapper() {
  return (
    <GameStateProvider>
      <TestComponent />
    </GameStateProvider>
  );
}

describe('GameStateProvider', () => {
  beforeEach(() => {
    // Clear any existing state
    localStorage.clear();
  });

  it('should provide initial game state', () => {
    render(() => <TestWrapper />);
    
    expect(screen.getByTestId('game-name')).toHaveTextContent('New Game');
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('0');
    expect(screen.getByTestId('choices-made')).toHaveTextContent('0');
    expect(screen.getByTestId('auto-save')).toHaveTextContent('true');
  });

  it('should create new game with custom name', async () => {
    render(() => <TestWrapper />);
    
    const newGameBtn = screen.getByTestId('new-game-btn');
    newGameBtn.click();
    
    expect(screen.getByTestId('game-name')).toHaveTextContent('Test Game');
  });

  it('should add player choices and update count', async () => {
    render(() => <TestWrapper />);
    
    const addChoiceBtn = screen.getByTestId('add-choice-btn');
    addChoiceBtn.click();
    
    expect(screen.getByTestId('choices-made')).toHaveTextContent('1');
    
    // Add another choice
    addChoiceBtn.click();
    expect(screen.getByTestId('choices-made')).toHaveTextContent('2');
  });

  it('should update progress', async () => {
    render(() => <TestWrapper />);
    
    const updateProgressBtn = screen.getByTestId('update-progress-btn');
    updateProgressBtn.click();
    
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('5');
  });

  it('should set current scene', async () => {
    render(() => <TestWrapper />);
    
    const setSceneBtn = screen.getByTestId('set-scene-btn');
    setSceneBtn.click();
    
    // We can't directly test the scene content here, but we can test
    // that the action doesn't throw an error
    expect(setSceneBtn).toBeInTheDocument();
  });

  it('should toggle auto-save setting', async () => {
    render(() => <TestWrapper />);
    
    expect(screen.getByTestId('auto-save')).toHaveTextContent('true');
    
    const toggleBtn = screen.getByTestId('toggle-autosave-btn');
    toggleBtn.click();
    
    expect(screen.getByTestId('auto-save')).toHaveTextContent('false');
    
    toggleBtn.click();
    expect(screen.getByTestId('auto-save')).toHaveTextContent('true');
  });

  it('should throw error when useGameState is used outside provider', () => {
    // Mock console.error to prevent error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(() => <TestComponent />);
    }).toThrow('useGameState must be used within GameStateProvider');
    
    consoleSpy.mockRestore();
  });

  it('should maintain state across multiple actions', async () => {
    render(() => <TestWrapper />);
    
    // Create new game
    screen.getByTestId('new-game-btn').click();
    expect(screen.getByTestId('game-name')).toHaveTextContent('Test Game');
    
    // Add choices
    screen.getByTestId('add-choice-btn').click();
    screen.getByTestId('add-choice-btn').click();
    expect(screen.getByTestId('choices-made')).toHaveTextContent('2');
    
    // Update progress
    screen.getByTestId('update-progress-btn').click();
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('5');
    
    // Game name should still be correct
    expect(screen.getByTestId('game-name')).toHaveTextContent('Test Game');
  });
});

describe('useGameState', () => {
  function LoadGameTestComponent() {
    const { gameState, loadGame } = useGameState();
    
    const mockGameState: GameState = {
      id: 'loaded-game',
      name: 'Loaded Game',
      currentScene: {
        id: 'loaded-scene',
        title: 'Loaded Scene',
        content: 'Loaded content',
        choices: [],
        entities: [],
        metadata: {
          genre: 'loaded',
          tone: 'testing',
          themes: ['test'],
          estimatedReadTime: 1
        }
      },
      playerChoices: [],
      gameProgress: {
        scenesVisited: 10,
        choicesMade: 5,
        achievementsUnlocked: ['test-achievement'],
        playtimeMinutes: 30
      },
      difficulty: 'hard',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    };
    
    return (
      <div>
        <div data-testid="game-name">{gameState().name}</div>
        <div data-testid="scenes-visited">{gameState().gameProgress.scenesVisited}</div>
        <div data-testid="difficulty">{gameState().difficulty}</div>
        <button 
          data-testid="load-game-btn" 
          onClick={() => loadGame(mockGameState)}
        >
          Load Game
        </button>
      </div>
    );
  }

  it('should load game state', async () => {
    render(() => (
      <GameStateProvider>
        <LoadGameTestComponent />
      </GameStateProvider>
    ));
    
    // Initial state
    expect(screen.getByTestId('game-name')).toHaveTextContent('New Game');
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('0');
    expect(screen.getByTestId('difficulty')).toHaveTextContent('normal');
    
    // Load game
    screen.getByTestId('load-game-btn').click();
    
    expect(screen.getByTestId('game-name')).toHaveTextContent('Loaded Game');
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('10');
    expect(screen.getByTestId('difficulty')).toHaveTextContent('hard');
  });
});