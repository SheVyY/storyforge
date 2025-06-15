import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { GameStateProvider, useGameState } from '../../lib/simpleState';
import { StorageManager } from '../../lib/storage';

// Test component for storage-state integration
function StorageStateTestComponent() {
  const { 
    gameState, 
    createNewGame, 
    addPlayerChoice, 
    updateProgress,
    loadGame,
    setCurrentScene 
  } = useGameState();

  const handleCreateGame = () => {
    createNewGame('Storage Test Game');
  };

  const handleAddProgress = () => {
    addPlayerChoice({
      id: 'test-choice',
      text: 'Test choice',
      consequence: 'Test consequence',
      impact: { narrative: 5, character: 3, world: 7 }
    });
    updateProgress({
      scenesVisited: gameState().gameProgress.scenesVisited + 1,
      playtimeMinutes: gameState().gameProgress.playtimeMinutes + 5
    });
  };

  const handleSetScene = () => {
    setCurrentScene({
      id: 'test-scene',
      title: 'Test Scene',
      content: 'Test content',
      choices: [],
      entities: [],
      metadata: {
        genre: 'test',
        tone: 'testing',
        themes: ['test'],
        estimatedReadTime: 2
      }
    });
  };

  const handleSaveGame = async () => {
    try {
      await StorageManager.saveGame(gameState(), 'Auto Save Test');
      // Update UI to show save completed
      const saveStatus = document.getElementById('save-status');
      if (saveStatus) saveStatus.textContent = 'Saved';
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleLoadGame = async () => {
    try {
      const saves = await StorageManager.listSaves();
      if (saves.length > 0) {
        const loadedGame = await StorageManager.loadGame(saves[0].id);
        if (loadedGame) {
          loadGame(loadedGame);
          // Update UI to show load completed
          const loadStatus = document.getElementById('load-status');
          if (loadStatus) loadStatus.textContent = 'Loaded';
        }
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const handleExportSave = async () => {
    try {
      const saves = await StorageManager.listSaves();
      if (saves.length > 0) {
        const exported = await StorageManager.exportSave(saves[0].id);
        const exportStatus = document.getElementById('export-status');
        if (exportStatus) exportStatus.textContent = 'Exported';
        
        // Store in global for testing
        (window as any).testExportData = exported;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportSave = async () => {
    try {
      const exportData = (window as any).testExportData;
      if (exportData) {
        await StorageManager.importSave(exportData);
        const importStatus = document.getElementById('import-status');
        if (importStatus) importStatus.textContent = 'Imported';
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div>
      <div data-testid="game-name">{gameState().name}</div>
      <div data-testid="game-id">{gameState().id}</div>
      <div data-testid="choices-made">{gameState().gameProgress.choicesMade}</div>
      <div data-testid="scenes-visited">{gameState().gameProgress.scenesVisited}</div>
      <div data-testid="playtime">{gameState().gameProgress.playtimeMinutes}</div>
      <div data-testid="difficulty">{gameState().difficulty}</div>
      <div data-testid="current-scene-id">{gameState().currentScene?.id || 'none'}</div>
      
      <div id="save-status">Not saved</div>
      <div id="load-status">Not loaded</div>
      <div id="export-status">Not exported</div>
      <div id="import-status">Not imported</div>
      
      <button data-testid="create-game" onClick={handleCreateGame}>
        Create Game
      </button>
      
      <button data-testid="add-progress" onClick={handleAddProgress}>
        Add Progress
      </button>
      
      <button data-testid="set-scene" onClick={handleSetScene}>
        Set Scene
      </button>
      
      <button data-testid="save-game" onClick={handleSaveGame}>
        Save Game
      </button>
      
      <button data-testid="load-game" onClick={handleLoadGame}>
        Load Game
      </button>
      
      <button data-testid="export-save" onClick={handleExportSave}>
        Export Save
      </button>
      
      <button data-testid="import-save" onClick={handleImportSave}>
        Import Save
      </button>
    </div>
  );
}

function TestWrapper() {
  return (
    <GameStateProvider>
      <StorageStateTestComponent />
    </GameStateProvider>
  );
}

describe('Storage State Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clean up any test data from window
    (window as any).testExportData = undefined;
  });

  afterEach(async () => {
    // Clean up saves
    const saves = await StorageManager.listSaves();
    for (const save of saves) {
      await StorageManager.deleteGame(save.id);
    }
  });

  it('should save and load complete game state', async () => {
    render(() => <TestWrapper />);

    // Create initial game state
    fireEvent.click(screen.getByTestId('create-game'));
    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('set-scene'));

    // Capture state before save
    const beforeSave = {
      name: screen.getByTestId('game-name').textContent,
      choices: screen.getByTestId('choices-made').textContent,
      scenes: screen.getByTestId('scenes-visited').textContent,
      playtime: screen.getByTestId('playtime').textContent,
      sceneId: screen.getByTestId('current-scene-id').textContent
    };

    // Save game
    fireEvent.click(screen.getByTestId('save-game'));
    
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    // Verify save was created
    const saves = await StorageManager.listSaves();
    expect(saves).toHaveLength(1);
    expect(saves[0].name).toBe('Auto Save Test');

    // Modify state after save
    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('add-progress'));

    // Verify state changed
    expect(screen.getByTestId('choices-made')).not.toHaveTextContent(beforeSave.choices!);

    // Load game
    fireEvent.click(screen.getByTestId('load-game'));
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    // Verify state was restored
    expect(screen.getByTestId('game-name')).toHaveTextContent(beforeSave.name!);
    expect(screen.getByTestId('choices-made')).toHaveTextContent(beforeSave.choices!);
    expect(screen.getByTestId('scenes-visited')).toHaveTextContent(beforeSave.scenes!);
    expect(screen.getByTestId('playtime')).toHaveTextContent(beforeSave.playtime!);
    expect(screen.getByTestId('current-scene-id')).toHaveTextContent(beforeSave.sceneId!);
  });

  it('should handle export and import cycle', async () => {
    render(() => <TestWrapper />);

    // Create and save game
    fireEvent.click(screen.getByTestId('create-game'));
    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('save-game'));

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    // Export save
    fireEvent.click(screen.getByTestId('export-save'));
    
    await waitFor(() => {
      expect(screen.getByText('Exported')).toBeInTheDocument();
    });

    // Verify export data exists
    expect((window as any).testExportData).toBeDefined();
    expect(typeof (window as any).testExportData).toBe('string');

    // Delete original save
    const saves = await StorageManager.listSaves();
    await StorageManager.deleteGame(saves[0].id);

    // Verify save was deleted
    const remainingSaves = await StorageManager.listSaves();
    expect(remainingSaves).toHaveLength(0);

    // Import save
    fireEvent.click(screen.getByTestId('import-save'));
    
    await waitFor(() => {
      expect(screen.getByText('Imported')).toBeInTheDocument();
    });

    // Verify save was restored
    const restoredSaves = await StorageManager.listSaves();
    expect(restoredSaves).toHaveLength(1);
    expect(restoredSaves[0].name).toBe('Auto Save Test');

    // Load imported save
    fireEvent.click(screen.getByTestId('load-game'));
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    // Verify game state was restored
    expect(screen.getByTestId('game-name')).toHaveTextContent('Storage Test Game');
    expect(screen.getByTestId('choices-made')).toHaveTextContent('1');
  });

  it('should preserve game state integrity across multiple save/load cycles', async () => {
    render(() => <TestWrapper />);

    // Create initial state
    fireEvent.click(screen.getByTestId('create-game'));
    fireEvent.click(screen.getByTestId('set-scene'));

    // Cycle 1: Save and load
    fireEvent.click(screen.getByTestId('save-game'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('load-game'));
    await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());

    // Verify state after cycle 1
    expect(screen.getByTestId('choices-made')).toHaveTextContent('0');

    // Cycle 2: Add progress and save again
    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('add-progress'));
    fireEvent.click(screen.getByTestId('save-game'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());

    // Verify multiple saves exist
    const saves = await StorageManager.listSaves();
    expect(saves).toHaveLength(2);

    // Load most recent save
    fireEvent.click(screen.getByTestId('load-game'));
    await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());

    // Verify final state
    expect(screen.getByTestId('choices-made')).toHaveTextContent('2');
    expect(screen.getByTestId('current-scene-id')).toHaveTextContent('test-scene');
  });

  it('should handle concurrent save/load operations gracefully', async () => {
    render(() => <TestWrapper />);

    // Create game state
    fireEvent.click(screen.getByTestId('create-game'));
    fireEvent.click(screen.getByTestId('add-progress'));

    // Trigger multiple save operations
    const savePromises = [
      StorageManager.saveGame(screen.getByTestId('game-name').textContent as any, 'Concurrent Save 1'),
      StorageManager.saveGame(screen.getByTestId('game-name').textContent as any, 'Concurrent Save 2'),
      StorageManager.saveGame(screen.getByTestId('game-name').textContent as any, 'Concurrent Save 3')
    ];

    // Wait for all saves to complete
    await Promise.allSettled(savePromises);

    // Verify saves were created
    const saves = await StorageManager.listSaves();
    expect(saves.length).toBeGreaterThan(0);
  });

  it('should maintain data consistency during storage operations', async () => {
    render(() => <TestWrapper />);

    // Create complex game state
    fireEvent.click(screen.getByTestId('create-game'));
    fireEvent.click(screen.getByTestId('set-scene'));
    
    // Add multiple progress updates
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId('add-progress'));
    }

    // Capture complex state
    const complexState = {
      name: screen.getByTestId('game-name').textContent,
      choices: screen.getByTestId('choices-made').textContent,
      scenes: screen.getByTestId('scenes-visited').textContent,
      playtime: screen.getByTestId('playtime').textContent,
      sceneId: screen.getByTestId('current-scene-id').textContent,
      difficulty: screen.getByTestId('difficulty').textContent
    };

    // Save complex state
    fireEvent.click(screen.getByTestId('save-game'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());

    // Verify storage contains correct data
    const saves = await StorageManager.listSaves();
    const savedData = await StorageManager.loadGame(saves[0].id);
    
    expect(savedData).toBeDefined();
    expect(savedData!.name).toBe(complexState.name);
    expect(savedData!.gameProgress.choicesMade).toBe(parseInt(complexState.choices!));
    expect(savedData!.gameProgress.scenesVisited).toBe(parseInt(complexState.scenes!));
    expect(savedData!.gameProgress.playtimeMinutes).toBe(parseInt(complexState.playtime!));
    expect(savedData!.currentScene?.id).toBe(complexState.sceneId);
    expect(savedData!.difficulty).toBe(complexState.difficulty);
  });
});