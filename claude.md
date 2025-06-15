# StoryForge: Technical Specification & Implementation Guide

## Project Overview

StoryForge is a cutting-edge browser-based interactive fiction game that runs a language model entirely client-side to generate dynamic narratives. This document serves as the comprehensive technical specification and implementation guide.

### Core Requirements
- Run 1-3B parameter LLM entirely in browser
- Generate dynamic narrative content with story coherence
- Maintain character consistency across sessions
- Work offline after initial load
- Save game state locally using IndexedDB
- Provide clean, focused text interface

## Technical Challenges Analysis

### Primary Challenges
1. **Browser LLM Inference**: Running 1-3B parameter models requires WebGL/WebGPU acceleration, optimized quantization (INT4/INT8), and efficient memory management
2. **Context Window Management**: Maintaining narrative coherence with ~2K-4K token limits through intelligent summarization and entity tracking
3. **Progressive Loading**: Streaming model weights while providing immediate user engagement
4. **Memory Constraints**: Managing ~2-6GB model weights within browser memory limits
5. **Offline-First Architecture**: Full functionality without network after initial load

### Browser-Specific Constraints
- SharedArrayBuffer requirements for model sharing between workers
- WebGPU availability and fallback strategies
- IndexedDB storage limits (varies by browser)
- Service Worker scope and caching strategies

## Recommended Technical Stack

### LLM Runtime & Inference
- **Primary**: WebLLM (MLC-LLM's browser runtime with WebGPU acceleration)
- **Fallback**: Transformers.js for devices without WebGPU support
- **Model Format**: GGUF 4-bit quantized (Phi-3-mini, Llama-3.2-1B)
- **Threading**: Web Workers + SharedArrayBuffer for offloaded inference

### Core Framework & Build
- **Framework**: SolidJS (superior reactivity with minimal bundle overhead)
- **Build**: Vite + Lightning CSS (fastest build performance)
- **Language**: TypeScript 5.3+ with strict mode

### State Management & Persistence
- **State**: Jotai (atomic state management ideal for complex game state)
- **Storage**: Dexie.js (structured IndexedDB with full-text search)
- **PWA**: Workbox (advanced PWA with background sync)

### Performance & UI
- **Layout**: CSS Container Queries for responsive narrative layouts
- **Animations**: Web Animations API for smooth text transitions
- **Optimization**: Intersection Observer for efficient scroll management
- **Typography**: Variable Fonts for optimized loading

## System Architecture

### Layered Architecture
```
┌─────────────────────────────────────────────────────────┐
│                 Presentation Layer                       │
│  StoryRenderer | ChoicePanel | SettingsUI | LoadingUI  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  Game Logic Layer                       │
│  NarrativeEngine | ChoiceProcessor | EntityTracker     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 AI Inference Layer                      │
│  ModelLoader | PromptManager | InferenceWorker         │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                Persistence Layer                        │
│  StorageManager | CacheManager | StateSerializer       │
└─────────────────────────────────────────────────────────┘
```

### Core Components

1. **ModelLoader**: Streams and initializes quantized models with progressive loading
2. **NarrativeEngine**: Orchestrates story generation with coherence tracking
3. **PromptManager**: Optimizes context window using sliding window + summaries
4. **EntityTracker**: Maintains character/world consistency without heavy NLP
5. **GameState**: Immutable state management with time-travel debugging
6. **StorageManager**: Efficient IndexedDB operations with compression

### Data Flow
Player Choice → ChoiceProcessor → NarrativeEngine → PromptManager → AI Inference → Story Update → UI Render → GameState Persist

## Model Loading Strategy

### Progressive Loading Architecture
```typescript
interface ModelLoadingStrategy {
  // Phase 1: Immediate engagement (0-2 seconds)
  templateMode: 'pre-written-scenarios',
  
  // Phase 2: Background loading (2-30 seconds)
  streamingLoader: 'chunked-model-weights',
  progressIndicator: 'story-themed-progress',
  
  // Phase 3: AI-enhanced mode (30+ seconds)
  fullAIMode: 'dynamic-generation'
}
```

### Loading Phases
1. **Instant Start (0-2s)**: Pre-written story branches with choice mechanics
2. **Progressive Enhancement (2-30s)**: Stream model chunks while showing themed loading
3. **Full AI Mode (30s+)**: Complete dynamic generation with model hot-swapping

### Optimization Techniques
- **Chunked Streaming**: 50MB chunks with resumable downloads
- **IndexedDB Caching**: Persistent model storage with versioning
- **WebAssembly Decompression**: Fast GGUF unpacking in worker threads
- **Service Worker Pre-fetching**: Background model updates
- **Model Tiering**: Phi-3-mini-4k (1.8GB) → Llama-3.2-1B (2.5GB) → Custom fine-tuned

### Fallback Strategy
```
WebGPU + Large Model → WebGL + Medium Model → CPU + Small Model → Template Mode
```

## Narrative Engine Design

### Context Window Management (Sliding Window + Memory)
```typescript
interface NarrativeContext {
  systemPrompt: string;           // Role, rules, genre
  entityMemory: EntityState[];    // Characters, locations, relationships
  recentHistory: Interaction[];   // Last 10-15 interactions
  summaryBuffer: string;          // Compressed older content
  choiceHistory: Decision[];      // Important player decisions
}
```

### Prompt Engineering Strategy
```typescript
const SYSTEM_PROMPT = `You are a masterful storyteller creating an interactive fantasy adventure.

RULES:
- Maintain consistency with established characters and world details
- Generate exactly 3 meaningful choices that advance the story
- Keep responses between 100-200 words
- Focus on immersive, second-person narrative
- Never break character or reference the AI system

CURRENT ENTITIES: {entityMemory}
RECENT EVENTS: {summaryBuffer}
LAST INTERACTION: {recentHistory}
`;
```

### Coherence Mechanisms
1. **Entity Tracking**: Simple key-value store for character traits, relationships, locations
2. **Consistency Checking**: Validate responses against entity memory
3. **Fallback Generation**: Re-generate if consistency checks fail
4. **Memory Consolidation**: Periodic summary of events and entity updates

### Choice Architecture
- **Branching**: Meaningful consequences that affect story direction
- **Character Development**: Choices that reveal/develop personality
- **World Interaction**: Environmental and social choices
- **Risk/Reward**: Balanced decision outcomes

## State Management & Persistence

### Jotai Atomic State Design
```typescript
// Core game atoms
const gameStateAtom = atom({
  currentScene: Scene,
  playerChoices: Choice[],
  gameProgress: Progress,
  difficulty: DifficultyLevel
});

const entityStateAtom = atom({
  characters: Map<string, Character>,
  locations: Map<string, Location>,
  relationships: RelationshipGraph,
  worldFacts: Fact[]
});

const narrativeContextAtom = atom({
  recentHistory: Interaction[],
  summaryBuffer: string,
  entityMemory: EntityMemory,
  contextWindow: TokenWindow
});
```

### IndexedDB Schema with Dexie
```typescript
class StoryForgeDB extends Dexie {
  gameSaves!: Table<GameSave>;
  modelCache!: Table<ModelData>;
  userSettings!: Table<Setting>;
  
  constructor() {
    super('StoryForgeDB');
    this.version(1).stores({
      gameSaves: '++id, name, timestamp, compressed_state',
      modelCache: 'model_id, weights, metadata, version',
      userSettings: 'key, value, category'
    });
  }
}
```

### Persistence Strategy
- **Auto-save**: After each story segment (differential compression)
- **Manual Slots**: 10 named save slots with thumbnails
- **Export/Import**: JSON export for save sharing
- **Model Caching**: Persistent model weights with versioning
- **Settings Sync**: Real-time preference synchronization

## Implementation Plan

### Phase 0: Foundation (Week 1-2)
- Project setup with Vite + SolidJS + TypeScript
- Basic UI components and routing
- IndexedDB setup with Dexie
- Service Worker skeleton
- **Deliverable**: Basic app shell with navigation

### Phase 1: Template Mode (Week 3-4)
- Pre-written story scenarios with branching choices
- Basic state management with Jotai
- Story renderer and choice components
- Save/load functionality
- **Deliverable**: Playable template-based game

### Phase 2: AI Integration (Week 5-8)
- WebLLM integration with model loading
- Progressive loading with fallbacks
- Basic prompt engineering
- Model caching in IndexedDB
- **Deliverable**: AI-powered story generation

### Phase 3: Narrative Engine (Week 9-12)
- Context window management
- Entity tracking system
- Coherence mechanisms
- Advanced prompt templates
- **Deliverable**: Coherent multi-session stories

### Phase 4: Polish & Performance (Week 13-16)
- PWA optimization
- Advanced caching strategies
- Performance monitoring
- Accessibility enhancements
- **Deliverable**: Production-ready application

### Risk Mitigation
- Weekly prototype validations
- Performance benchmarking at each phase
- Fallback strategies for each critical component
- User testing from Phase 1 onwards

## Core Component Implementation

### ModelLoader Class
```typescript
class ModelLoader {
  private models: Map<string, Model> = new Map();
  private loadingProgress: Signal<number> = signal(0);
  
  async loadModel(modelId: string, options: LoadOptions): Promise<Model> {
    // Progressive loading with chunked streaming
    // IndexedDB caching with versioning
    // WebWorker-based decompression
    // Fallback strategy implementation
  }
  
  async initializeInference(model: Model): Promise<InferenceEngine> {
    // WebGPU/WebGL detection and setup
    // Memory optimization
    // Context window configuration
  }
}
```

### NarrativeEngine Class
```typescript
class NarrativeEngine {
  private context: NarrativeContext;
  private entityTracker: EntityTracker;
  private promptManager: PromptManager;
  
  async generateStorySegment(choice: PlayerChoice): Promise<StorySegment> {
    // Context window management
    // Entity consistency checking
    // Prompt optimization
    // Response validation
  }
  
  async generateChoices(currentStory: StorySegment): Promise<Choice[]> {
    // Choice architecture implementation
    // Meaningful consequence design
    // Balance validation
  }
}
```

### EntityTracker Class
```typescript
class EntityTracker {
  private entities: Map<string, Entity> = new Map();
  private relationships: RelationshipGraph = new RelationshipGraph();
  
  updateEntity(name: string, properties: Partial<Entity>): void {
    // Simple key-value tracking
    // Relationship updates
    // Consistency validation
  }
  
  getEntityContext(): string {
    // Generate compact entity description for prompts
    // Prioritize recent and important entities
  }
}
```

## Performance Optimization Strategies

### Model Optimization
- 4-bit quantization (GGUF format)
- Layer-wise model loading
- Dynamic vocabulary pruning
- Context length optimization

### Memory Management
- Garbage collection scheduling
- Model weight sharing between workers
- Context window sliding algorithms
- Entity memory prioritization

### UI Performance
- Virtual scrolling for long narratives
- Incremental text rendering
- Animation frame scheduling
- Component lazy loading

### Caching Strategies
- Model weight caching (IndexedDB)
- Generated content caching
- Entity state snapshots
- Choice tree pruning

## Testing Methodology

### Unit Testing
- Component testing with SolidJS Testing Library
- State management testing with Jotai utilities
- AI inference mocking and validation
- Storage layer testing with fake IndexedDB

### Integration Testing
- End-to-end story generation flows
- Model loading and fallback scenarios
- Cross-browser compatibility testing
- Performance benchmark validation

### User Testing
- Narrative quality assessment
- Choice meaningfulness evaluation
- Loading time acceptability testing
- Accessibility compliance validation

## Security Considerations

### Client-Side Security
- Model weight integrity verification
- XSS prevention in generated content
- Safe JSON parsing for game saves
- Content Security Policy implementation

### Privacy Protection
- Local-only data storage
- No telemetry without explicit consent
- Secure game save export/import
- Anonymous usage analytics (optional)

## Research References

### Browser-Based LLM
- WebLLM: https://github.com/mlc-ai/web-llm
- Transformers.js: https://github.com/xenova/transformers.js
- WebGPU Compute: https://gpuweb.github.io/gpuweb/

### Narrative AI Research
- Interactive Narrative Generation papers
- Context Window Management techniques
- Entity tracking in conversational AI
- Prompt engineering best practices

### Performance Optimization
- WebAssembly for ML workloads
- SharedArrayBuffer optimization patterns
- IndexedDB performance techniques
- Service Worker caching strategies

---

*This document serves as the living technical specification for StoryForge. It should be updated as implementation progresses and new optimizations are discovered.*