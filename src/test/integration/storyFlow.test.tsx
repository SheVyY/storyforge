import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { GameStateProvider, useGameState } from '../../lib/simpleState';
import { StorageManager } from '../../lib/storage';
import { StoryEngine } from '../../lib/storyEngine';
import StoryRenderer from '../../components/StoryRenderer';
import { type Choice } from '../../types';

// Integration test component that simulates full story flow
function StoryFlowTestComponent() {
  const { 
    gameState, 
    createNewGame, 
    addPlayerChoice, 
    setCurrentScene, 
    updateProgress,
    loadGame 
  } = useGameState();

  const engine = new StoryEngine('mysterious-portal');

  const handleStartNewGame = () => {
    createNewGame('Integration Test Game');
    const startScene = engine.startNewStory('mysterious-portal');
    if (startScene) {
      setCurrentScene(startScene);
      updateProgress({ 
        scenesVisited: 1,
        choicesMade: 0
      });
    }
  };

  const handleChoiceSelect = (choice: Choice) => {
    addPlayerChoice(choice);
    const nextScene = engine.makeChoice(choice);
    if (nextScene) {
      setCurrentScene(nextScene);
      // Force update of scenes visited count to match game logic
      updateProgress({ 
        scenesVisited: gameState().gameProgress.scenesVisited + 1,
        choicesMade: gameState().gameProgress.choicesMade + 1
      });
    }
  };

  const handleSaveGame = async () => {
    await StorageManager.saveGame(gameState(), 'Integration Test Save');
  };

  const handleLoadGame = async () => {
    const saves = await StorageManager.listSaves();
    if (saves.length > 0) {
      const saveData = await StorageManager.loadGame(saves[0].id);
      if (saveData) {
        loadGame(saveData);
      }
    }
  };

  return (
    <div>
      <div data-testid="game-name">{gameState().name}</div>
      <div data-testid="choices-made">{gameState().gameProgress.choicesMade}</div>
      <div data-testid="scenes-visited">{gameState().gameProgress.scenesVisited}</div>
      
      <button data-testid="start-new-game" onClick={handleStartNewGame}>
        Start New Game
      </button>
      
      <button data-testid="save-game" onClick={handleSaveGame}>
        Save Game
      </button>
      
      <button data-testid="load-game" onClick={handleLoadGame}>
        Load Game
      </button>

      {gameState().currentScene && (
        <StoryRenderer
          scene={gameState().currentScene}
          isLoading={false}
          onChoiceSelect={handleChoiceSelect}
        />
      )}
    </div>
  );
}

function TestWrapper() {
  return (
    <GameStateProvider>
      <StoryFlowTestComponent />
    </GameStateProvider>
  );
}

describe('Story Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(async () => {
    // Clean up saves
    const saves = await StorageManager.listSaves();
    for (const save of saves) {
      await StorageManager.deleteGame(save.id);
    }
  });

  it('should complete full story flow: start game -> make choices -> save -> load', async () => {
    render(() => <TestWrapper />);

    // Start new game
    const startButton = screen.getByTestId('start-new-game');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId('game-name')).toHaveTextContent('Integration Test Game');
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Verify initial state
    expect(screen.getByTestId('choices-made')).toHaveTextContent('0');
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('1');

    // Make first choice
    const firstChoice = screen.getByText('Step through the portal boldly');
    fireEvent.click(firstChoice);

    await waitFor(() => {
      expect(screen.getByTestId('choices-made')).toHaveTextContent('1');
      expect(screen.getByTestId('scenes-visited')).toHaveTextContent('2');
    });

    // Save the game
    const saveButton = screen.getByTestId('save-game');
    fireEvent.click(saveButton);

    // Wait for save to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify save was created
    const saves = await StorageManager.listSaves();
    expect(saves).toHaveLength(1);
    expect(saves[0].name).toBe('Integration Test Save');

    // Make another choice to modify state
    const choiceButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent && !btn.dataset.testid
    );
    if (choiceButtons.length > 0) {
      fireEvent.click(choiceButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('choices-made')).toHaveTextContent('2');
      });
    }

    // Load the saved game (should revert to previous state)
    const loadButton = screen.getByTestId('load-game');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByTestId('game-name')).toHaveTextContent('Integration Test Game');
      expect(screen.getByTestId('choices-made')).toHaveTextContent('1');
      expect(screen.getByTestId('scenes-visited')).toHaveTextContent('2');
    });
  });

  it('should maintain story engine state consistency with game state', async () => {
    render(() => <TestWrapper />);

    // Start new game
    fireEvent.click(screen.getByTestId('start-new-game'));

    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Make multiple choices and verify state consistency
    for (let i = 0; i < 3; i++) {
      const choiceButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent && !btn.dataset.testid
      );
      
      if (choiceButtons.length > 0) {
        fireEvent.click(choiceButtons[0]);
        
        await waitFor(() => {
          const choicesMade = parseInt(screen.getByTestId('choices-made').textContent || '0');
          expect(choicesMade).toBe(i + 1);
        });
      }
    }

    // Verify final state
    const finalChoicesMade = parseInt(screen.getByTestId('choices-made').textContent || '0');
    const finalScenesVisited = parseInt(screen.getByTestId('scenes-visited').textContent || '0');
    
    expect(finalChoicesMade).toBeGreaterThan(0);
    expect(finalScenesVisited).toBeGreaterThan(finalChoicesMade);
  });

  it('should handle save/load cycle preserving all game data', async () => {
    render(() => <TestWrapper />);

    // Create game and make some progress
    fireEvent.click(screen.getByTestId('start-new-game'));
    
    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Make a few choices
    const makeChoice = async () => {
      const choiceButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent && !btn.dataset.testid
      );
      if (choiceButtons.length > 0) {
        fireEvent.click(choiceButtons[0]);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    await makeChoice();
    await makeChoice();

    const beforeSaveChoices = screen.getByTestId('choices-made').textContent;
    const beforeSaveScenes = screen.getByTestId('scenes-visited').textContent;

    // Save game
    fireEvent.click(screen.getByTestId('save-game'));
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify save exists
    const saves = await StorageManager.listSaves();
    expect(saves).toHaveLength(1);

    // Load game
    fireEvent.click(screen.getByTestId('load-game'));

    await waitFor(() => {
      expect(screen.getByTestId('choices-made')).toHaveTextContent(beforeSaveChoices!);
      expect(screen.getByTestId('scenes-visited')).toHaveTextContent(beforeSaveScenes!);
      expect(screen.getByTestId('game-name')).toHaveTextContent('Integration Test Game');
    });
  });

  it('should handle story progression with scene transitions', async () => {
    render(() => <TestWrapper />);

    // Start game
    fireEvent.click(screen.getByTestId('start-new-game'));

    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Track scene changes
    const initialSceneTitle = screen.getByRole('heading', { level: 2 }).textContent;

    // Make choice to progress to next scene
    const choiceButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent && !btn.dataset.testid
    );
    
    expect(choiceButtons.length).toBeGreaterThan(0);
    fireEvent.click(choiceButtons[0]);

    // Wait for scene transition
    await waitFor(() => {
      const currentSceneTitle = screen.getByRole('heading', { level: 2 }).textContent;
      expect(currentSceneTitle).not.toBe(initialSceneTitle);
    }, { timeout: 1000 });

    // Verify new scene loaded with choices
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent('2');
    expect(screen.getByTestId('choices-made')).toHaveTextContent('1');
  });
});