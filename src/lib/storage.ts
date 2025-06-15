import Dexie, { type Table } from 'dexie';
import { type GameState, type ModelInfo } from '../types';

export interface StoredGameSave {
  id: string;
  name: string;
  thumbnail?: string;
  gameState: GameState;
  timestamp: Date;
  compressed?: boolean;
}

export interface StoredModel {
  id: string;
  name: string;
  weights: ArrayBuffer;
  metadata: ModelInfo;
  version: string;
  timestamp: Date;
}

export interface StoredSetting {
  key: string;
  value: unknown;
  category: string;
  timestamp: Date;
}

export class StoryForgeDB extends Dexie {
  gameSaves!: Table<StoredGameSave>;
  modelCache!: Table<StoredModel>;
  userSettings!: Table<StoredSetting>;

  constructor() {
    super('StoryForgeDB');
    
    this.version(1).stores({
      gameSaves: '&id, name, timestamp',
      modelCache: '&id, name, version, timestamp',
      userSettings: '&key, category, timestamp'
    });
  }
}

export const db = new StoryForgeDB();

export class StorageManager {
  static async saveGame(gameState: GameState, name?: string): Promise<string> {
    const id = gameState.id;
    const gameSave: StoredGameSave = {
      id,
      name: name || `Save ${new Date().toLocaleString()}`,
      gameState,
      timestamp: new Date()
    };
    
    await db.gameSaves.put(gameSave);
    return id;
  }

  static async loadGame(id: string): Promise<GameState | undefined> {
    const save = await db.gameSaves.get(id);
    return save?.gameState;
  }

  static async listSaves(): Promise<StoredGameSave[]> {
    return await db.gameSaves.orderBy('timestamp').reverse().toArray();
  }

  static async deleteGame(id: string): Promise<void> {
    await db.gameSaves.delete(id);
  }

  static async exportSave(id: string): Promise<string> {
    const save = await db.gameSaves.get(id);
    if (!save) throw new Error('Save not found');
    return JSON.stringify(save, null, 2);
  }

  static async importSave(jsonData: string): Promise<string> {
    const save: StoredGameSave = JSON.parse(jsonData);
    save.timestamp = new Date();
    await db.gameSaves.put(save);
    return save.id;
  }

  static async cacheModel(modelId: string, weights: ArrayBuffer, metadata: ModelInfo): Promise<void> {
    const model: StoredModel = {
      id: modelId,
      name: metadata.name,
      weights,
      metadata,
      version: '1.0.0',
      timestamp: new Date()
    };
    
    await db.modelCache.put(model);
  }

  static async getCachedModel(modelId: string): Promise<StoredModel | undefined> {
    return await db.modelCache.get(modelId);
  }

  static async clearModelCache(): Promise<void> {
    await db.modelCache.clear();
  }

  static async setSetting(key: string, value: unknown, category = 'general'): Promise<void> {
    const setting: StoredSetting = {
      key,
      value,
      category,
      timestamp: new Date()
    };
    
    await db.userSettings.put(setting);
  }

  static async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const setting = await db.userSettings.get(key);
    return setting ? (setting.value as T) : defaultValue;
  }

  static async getAllSettings(category?: string): Promise<Record<string, unknown>> {
    let settings: StoredSetting[];
    
    if (category) {
      settings = await db.userSettings.where('category').equals(category).toArray();
    } else {
      settings = await db.userSettings.toArray();
    }
    
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  static async getStorageInfo(): Promise<{
    saves: number;
    models: number;
    settings: number;
    estimatedSize: string;
  }> {
    const [saves, models, settings] = await Promise.all([
      db.gameSaves.count(),
      db.modelCache.count(),
      db.userSettings.count()
    ]);

    // Estimate storage size (rough calculation)
    const modelWeights = await db.modelCache.toArray();
    const totalModelSize = modelWeights.reduce((sum, model) => sum + model.weights.byteLength, 0);
    const estimatedSize = `${Math.round(totalModelSize / (1024 * 1024))}MB`;

    return {
      saves,
      models,
      settings,
      estimatedSize
    };
  }
}