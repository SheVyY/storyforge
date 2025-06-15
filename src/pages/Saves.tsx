import { type Component, createSignal, onMount, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { StorageManager, type StoredGameSave } from '../lib/storage';
import { useGameState } from '../lib/simpleState';
import './Saves.css';

const Saves: Component = () => {
  const navigate = useNavigate();
  const { loadGame } = useGameState();
  
  const [saves, setSaves] = createSignal<StoredGameSave[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedSave, setSelectedSave] = createSignal<string | null>(null);

  onMount(async () => {
    await loadSaves();
  });

  const loadSaves = async () => {
    setIsLoading(true);
    try {
      const savedGames = await StorageManager.listSaves();
      setSaves(savedGames);
    } catch (error) {
      console.error('Error loading saves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadGame = async (save: StoredGameSave) => {
    try {
      loadGame(save.gameState);
      navigate('/');
    } catch (error) {
      console.error('Error loading game:', error);
      alert('Failed to load game save');
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    if (confirm('Are you sure you want to delete this save?')) {
      try {
        await StorageManager.deleteGame(saveId);
        await loadSaves();
      } catch (error) {
        console.error('Error deleting save:', error);
        alert('Failed to delete save');
      }
    }
  };

  const handleExportSave = async (saveId: string) => {
    try {
      const saveData = await StorageManager.exportSave(saveId);
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyforge-save-${saveId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting save:', error);
      alert('Failed to export save');
    }
  };

  const handleImportSave = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await StorageManager.importSave(text);
        await loadSaves();
        alert('Save imported successfully!');
      } catch (error) {
        console.error('Error importing save:', error);
        alert('Failed to import save. Make sure the file is valid.');
      }
    };
    
    input.click();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div class="saves-page">
      <div class="saves-header">
        <h1>Game Saves</h1>
        <button class="import-button" onClick={handleImportSave}>
          Import Save
        </button>
      </div>

      <Show 
        when={!isLoading()} 
        fallback={<div class="loading">Loading saves...</div>}
      >
        <Show 
          when={saves().length > 0} 
          fallback={
            <div class="no-saves">
              <p>No saved games yet.</p>
              <p>Start a new adventure and save your progress!</p>
            </div>
          }
        >
          <div class="saves-grid">
            <For each={saves()}>
              {(save) => (
                <div 
                  class={`save-card ${selectedSave() === save.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSave(save.id)}
                >
                  <div class="save-header">
                    <h3 class="save-name">{save.name}</h3>
                    <span class="save-date">{formatDate(save.timestamp)}</span>
                  </div>
                  
                  <div class="save-details">
                    <div class="save-stat">
                      <span class="stat-label">Progress:</span>
                      <span class="stat-value">
                        {save.gameState.gameProgress.scenesVisited} scenes
                      </span>
                    </div>
                    <div class="save-stat">
                      <span class="stat-label">Choices:</span>
                      <span class="stat-value">
                        {save.gameState.gameProgress.choicesMade}
                      </span>
                    </div>
                    <div class="save-stat">
                      <span class="stat-label">Playtime:</span>
                      <span class="stat-value">
                        {formatPlaytime(save.gameState.gameProgress.playtimeMinutes)}
                      </span>
                    </div>
                  </div>
                  
                  <div class="save-actions">
                    <button 
                      class="save-action load"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadGame(save);
                      }}
                    >
                      Load
                    </button>
                    <button 
                      class="save-action export"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSave(save.id);
                      }}
                    >
                      Export
                    </button>
                    <button 
                      class="save-action delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSave(save.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
      
      <div class="storage-info">
        <p>Saves are stored locally in your browser.</p>
      </div>
    </div>
  );
};

export default Saves;