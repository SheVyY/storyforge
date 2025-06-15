export interface GameState {
  id: string;
  name: string;
  currentScene: Scene;
  playerChoices: Choice[];
  gameProgress: Progress;
  difficulty: DifficultyLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scene {
  id: string;
  title: string;
  content: string;
  choices: Choice[];
  entities: EntityReference[];
  metadata: SceneMetadata;
}

export interface Choice {
  id: string;
  text: string;
  consequence: string;
  nextSceneId?: string;
  requirements?: Requirement[];
  impact: ChoiceImpact;
}

export interface EntityReference {
  id: string;
  name: string;
  type: EntityType;
  properties: Record<string, unknown>;
}

export interface Progress {
  scenesVisited: number;
  choicesMade: number;
  achievementsUnlocked: string[];
  playtimeMinutes: number;
}

export interface NarrativeContext {
  systemPrompt: string;
  entityMemory: EntityState[];
  recentHistory: Interaction[];
  summaryBuffer: string;
  choiceHistory: Decision[];
}

export interface EntityState {
  id: string;
  name: string;
  type: EntityType;
  traits: Record<string, string>;
  relationships: Map<string, RelationshipType>;
  lastMentioned: Date;
  importance: number;
}

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  timestamp: Date;
  entities: string[];
}

export interface Decision {
  choiceId: string;
  choiceText: string;
  consequence: string;
  timestamp: Date;
  importance: number;
}

export interface SceneMetadata {
  genre: string;
  tone: string;
  themes: string[];
  estimatedReadTime: number;
}

export interface ChoiceImpact {
  narrative: number;
  character: number;
  world: number;
}

export interface Requirement {
  type: RequirementType;
  value: string | number;
  operator: ComparisonOperator;
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';
export type EntityType = 'character' | 'location' | 'item' | 'concept';
export type RelationshipType = 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
export type InteractionType = 'story' | 'choice' | 'consequence';
export type RequirementType = 'stat' | 'item' | 'relationship' | 'scene_visited';
export type ComparisonOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte';

export interface ModelLoadingState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  currentPhase: LoadingPhase;
  modelInfo?: ModelInfo;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  size: number;
  quantization: string;
  contextLength: number;
  capabilities: string[];
}

export type LoadingPhase = 'template' | 'downloading' | 'initializing' | 'ready';

export interface GenerationOptions {
  maxTokens: number;
  temperature: number;
  topP: number;
  repetitionPenalty: number;
  seed?: number;
}

export interface StorySegment {
  content: string;
  choices: Choice[];
  entities: EntityReference[];
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  tokenCount: number;
  generationTime: number;
  modelUsed: string;
  coherenceScore?: number;
}