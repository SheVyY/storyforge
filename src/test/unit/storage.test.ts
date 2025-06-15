import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageManager } from '../../lib/storage';
import { type GameState } from '../../types';

// Mock game state for testing
const mockGameState: GameState = {
  id: 'test-game-1',
  name: 'Test Game',
  currentScene: {
    id: 'test-scene',
    title: 'Test Scene',
    content: 'Test content',
    choices: [],
    entities: [],
    metadata: {
      genre: 'test',
      tone: 'testing',
      themes: ['test'],
      estimatedReadTime: 1
    }
  },
  playerChoices: [],
  gameProgress: {
    scenesVisited: 1,
    choicesMade: 0,
    achievementsUnlocked: [],
    playtimeMinutes: 5
  },
  difficulty: 'normal',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

describe('StorageManager', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    await StorageManager.clearModelCache();
  });

  afterEach(async () => {
    // Clean up after each test
    const saves = await StorageManager.listSaves();
    for (const save of saves) {
      await StorageManager.deleteGame(save.id);
    }
  });

  describe('saveGame and loadGame', () => {
    it('should save and load game state', async () => {
      const savedId = await StorageManager.saveGame(mockGameState, 'Test Save');
      expect(savedId).toBe(mockGameState.id);

      const loadedState = await StorageManager.loadGame(savedId);
      expect(loadedState).toBeDefined();
      expect(loadedState?.id).toBe(mockGameState.id);
      expect(loadedState?.name).toBe(mockGameState.name);
      expect(loadedState?.gameProgress.scenesVisited).toBe(1);
    });

    it('should return undefined for non-existent save', async () => {
      const loadedState = await StorageManager.loadGame('non-existent');
      expect(loadedState).toBeUndefined();
    });

    it('should use auto-generated name if none provided', async () => {
      await StorageManager.saveGame(mockGameState);
      const saves = await StorageManager.listSaves();
      
      expect(saves).toHaveLength(1);
      expect(saves[0].name).toMatch(/Save \d/);
    });
  });

  describe('listSaves', () => {
    it('should return empty array when no saves exist', async () => {
      const saves = await StorageManager.listSaves();
      expect(saves).toEqual([]);
    });

    it('should list all saved games', async () => {
      await StorageManager.saveGame(mockGameState, 'Save 1');
      await StorageManager.saveGame({
        ...mockGameState,
        id: 'test-game-2',
        name: 'Test Game 2'
      }, 'Save 2');

      const saves = await StorageManager.listSaves();
      expect(saves).toHaveLength(2);
      expect(saves.map(s => s.name)).toContain('Save 1');
      expect(saves.map(s => s.name)).toContain('Save 2');
    });

    it('should order saves by timestamp (newest first)', async () => {
      await StorageManager.saveGame(mockGameState, 'First Save');
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await StorageManager.saveGame({
        ...mockGameState,
        id: 'test-game-2'
      }, 'Second Save');

      const saves = await StorageManager.listSaves();
      expect(saves[0].name).toBe('Second Save');
      expect(saves[1].name).toBe('First Save');
    });
  });

  describe('deleteGame', () => {
    it('should delete existing save', async () => {
      await StorageManager.saveGame(mockGameState, 'To Delete');
      let saves = await StorageManager.listSaves();
      expect(saves).toHaveLength(1);

      await StorageManager.deleteGame(mockGameState.id);
      saves = await StorageManager.listSaves();
      expect(saves).toHaveLength(0);
    });

    it('should not throw error when deleting non-existent save', async () => {
      await expect(StorageManager.deleteGame('non-existent')).resolves.not.toThrow();
    });
  });

  describe('exportSave and importSave', () => {
    it('should export save as JSON string', async () => {
      await StorageManager.saveGame(mockGameState, 'Export Test');
      
      const exported = await StorageManager.exportSave(mockGameState.id);
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed.gameState.id).toBe(mockGameState.id);
      expect(parsed.name).toBe('Export Test');
    });

    it('should throw error when exporting non-existent save', async () => {
      await expect(StorageManager.exportSave('non-existent')).rejects.toThrow('Save not found');
    });

    it('should import save from JSON string', async () => {
      await StorageManager.saveGame(mockGameState, 'Import Test');
      const exported = await StorageManager.exportSave(mockGameState.id);
      
      // Delete original
      await StorageManager.deleteGame(mockGameState.id);
      
      // Import back
      const importedId = await StorageManager.importSave(exported);
      expect(importedId).toBe(mockGameState.id);
      
      const saves = await StorageManager.listSaves();
      expect(saves).toHaveLength(1);
      expect(saves[0].name).toBe('Import Test');
    });

    it('should update timestamp on import', async () => {
      const originalDate = new Date('2020-01-01');
      const saveWithOldDate = {
        ...mockGameState,
        createdAt: originalDate,
        updatedAt: originalDate
      };
      
      await StorageManager.saveGame(saveWithOldDate, 'Time Test');
      const exported = await StorageManager.exportSave(mockGameState.id);
      await StorageManager.deleteGame(mockGameState.id);
      
      const beforeImport = Date.now();
      await StorageManager.importSave(exported);
      const afterImport = Date.now();
      
      const saves = await StorageManager.listSaves();
      const importedTimestamp = saves[0].timestamp.getTime();
      
      expect(importedTimestamp).toBeGreaterThanOrEqual(beforeImport);
      expect(importedTimestamp).toBeLessThanOrEqual(afterImport);
    });
  });

  describe('settings management', () => {
    it('should save and get settings', async () => {
      await StorageManager.setSetting('testKey', 'testValue', 'testCategory');
      
      const value = await StorageManager.getSetting('testKey');
      expect(value).toBe('testValue');
    });

    it('should return default value for non-existent setting', async () => {
      const value = await StorageManager.getSetting('nonExistent', 'defaultValue');
      expect(value).toBe('defaultValue');
    });

    it('should get all settings', async () => {
      await StorageManager.setSetting('key1', 'value1', 'category1');
      await StorageManager.setSetting('key2', 'value2', 'category2');
      
      const allSettings = await StorageManager.getAllSettings();
      expect(allSettings.key1).toBe('value1');
      expect(allSettings.key2).toBe('value2');
    });

    it('should filter settings by category', async () => {
      await StorageManager.setSetting('key1', 'value1', 'category1');
      await StorageManager.setSetting('key2', 'value2', 'category2');
      
      const categorySettings = await StorageManager.getAllSettings('category1');
      expect(categorySettings.key1).toBe('value1');
      expect(categorySettings.key2).toBeUndefined();
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', async () => {
      await StorageManager.saveGame(mockGameState, 'Info Test');
      
      const info = await StorageManager.getStorageInfo();
      expect(info.saves).toBe(1);
      expect(info.models).toBe(0);
      expect(info.settings).toBeGreaterThanOrEqual(0);
      expect(typeof info.estimatedSize).toBe('string');
    });
  });
});