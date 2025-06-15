import { type Component, createSignal, onMount, Show, For } from 'solid-js';
import StoryRenderer from '../components/StoryRenderer';
import ModelDownloader from '../components/ModelDownloader';
import { type Choice } from '../types';
import { StoryEngine } from '../lib/storyEngine';
import { templateStories } from '../data/templateStories';
import { useGameState } from '../lib/simpleState';
import { StorageManager } from '../lib/storage';
import { aiStoryEngine } from '../lib/aiStoryEngine';
import { modelLoader } from '../lib/modelLoader';
import './Home.css';

const Home: Component = () => {
  const { 
    gameState, 
    setCurrentScene, 
    addPlayerChoice, 
    updateProgress, 
    createNewGame, 
    autoSaveEnabled 
  } = useGameState();
  
  const [isLoading, setIsLoading] = createSignal(false);
  const [showStorySelection, setShowStorySelection] = createSignal(true);
  const [showModelDownloader, setShowModelDownloader] = createSignal(false);
  const [storyEngine, setStoryEngine] = createSignal<StoryEngine | null>(null);
  const [aiMode, setAiMode] = createSignal(false);
  const [entities, setEntities] = createSignal<{
    characters: string[];
    locations: string[];
    themes: string[];
  }>({
    characters: [],
    locations: [],
    themes: ['adventure']
  });

  onMount(() => {
    // Check if there's a game in progress
    if (gameState().playerChoices.length > 0) {
      setShowStorySelection(false);
    }
  });

  const startNewStory = (storyId: string) => {
    const engine = new StoryEngine(storyId);
    const startScene = engine.startNewStory(storyId);
    
    if (startScene) {
      setStoryEngine(engine);
      setAiMode(false);
      createNewGame(templateStories.find(s => s.id === storyId)?.name || 'New Game');
      setCurrentScene(startScene);
      updateProgress({ scenesVisited: 1 });
      setShowStorySelection(false);
      
      // Reset entities for template stories
      setEntities({
        characters: [],
        locations: [],
        themes: ['adventure']
      });
    }
  };

  const startAiStory = async () => {
    if (!modelLoader.loadedModel()) {
      setShowModelDownloader(true);
      return;
    }

    // Create initial AI-generated scene
    setIsLoading(true);
    setAiMode(true);
    
    try {
      createNewGame('AI Adventure');
      
      // Generate opening scene
      const prompt = `You are starting a new interactive fantasy adventure. Create an engaging opening scene for the player.

RESPONSE FORMAT:
Title: [Scene Title]

[Opening scene content - 100-200 words in second person]

Choices:
1. [Choice 1]
2. [Choice 2]
3. [Choice 3]`;

      const response = await modelLoader.generateResponse(prompt);
      const scene = aiStoryEngine.parseSceneFromResponse(response);
      
      setCurrentScene(scene);
      updateProgress({ scenesVisited: 1 });
      setShowStorySelection(false);
      
      // Initialize entities
      const newEntities = aiStoryEngine.extractEntities(scene);
      setEntities({
        characters: newEntities.characters,
        locations: newEntities.locations,
        themes: ['adventure', 'ai-generated', ...newEntities.themes]
      });
      
    } catch (error) {
      console.error('Failed to start AI story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAiEnhancedStory = (storyId: string) => {
    // Start with template, but switch to AI after first choice
    const engine = new StoryEngine(storyId);
    const startScene = engine.startNewStory(storyId);
    
    if (startScene) {
      setStoryEngine(engine);
      setAiMode(true);
      createNewGame(`AI Enhanced: ${templateStories.find(s => s.id === storyId)?.name || 'Adventure'}`);
      setCurrentScene(startScene);
      updateProgress({ scenesVisited: 1 });
      setShowStorySelection(false);
      
      // Initialize entities from template
      const story = templateStories.find(s => s.id === storyId);
      setEntities({
        characters: [],
        locations: [],
        themes: [story?.genre || 'adventure', 'ai-enhanced']
      });
    }
  };

  const handleModelLoaded = (modelId: string) => {
    setShowModelDownloader(false);
    setAiMode(true);
    console.log(`Model ${modelId} loaded successfully`);
  };

  const handleCancelDownload = () => {
    setShowModelDownloader(false);
    setAiMode(false);
  };

  const handleChoiceSelect = async (choice: Choice) => {
    setIsLoading(true);
    
    try {
      // Add choice to history
      addPlayerChoice(choice);
      
      let nextScene = null;
      
      // Check if we should use AI generation
      if (aiMode() && aiStoryEngine.ready) {
        // Use AI to generate next scene
        const context = {
          currentScene: gameState().currentScene,
          playerChoices: gameState().playerChoices,
          gameProgress: gameState().gameProgress,
          entities: entities()
        };
        
        nextScene = await aiStoryEngine.generateNextScene(choice, context);
        
        // Update entities based on generated content
        if (nextScene) {
          const newEntities = aiStoryEngine.extractEntities(nextScene);
          setEntities(prev => ({
            characters: [...new Set([...prev.characters, ...newEntities.characters])],
            locations: [...new Set([...prev.locations, ...newEntities.locations])],
            themes: [...new Set([...prev.themes, ...newEntities.themes])]
          }));
        }
      } else {
        // Use template story engine
        const engine = storyEngine();
        if (engine && choice.nextSceneId) {
          nextScene = engine.makeChoice(choice);
        }
      }
      
      if (nextScene) {
        // Update game state
        setCurrentScene(nextScene);
        updateProgress({ 
          scenesVisited: gameState().gameProgress.scenesVisited + 1 
        });
        
        // Auto-save if enabled
        if (autoSaveEnabled()) {
          await StorageManager.saveGame(gameState());
        }
      } else if (choice.id === 'new-game') {
        // Return to story selection
        setShowStorySelection(true);
        createNewGame('New Game');
      }
    } catch (error) {
      console.error('Error processing choice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="home-page">
      <Show 
        when={!showStorySelection()} 
        fallback={
          <div class="story-selection">
            <h1 class="selection-title">Choose Your Adventure</h1>
            
            {/* AI Mode Toggle */}
            <div class="mode-selector">
              <div class="mode-options">
                <button 
                  class={`mode-button ${!aiMode() ? 'active' : ''}`}
                  onClick={() => setAiMode(false)}
                >
                  📚 Template Stories
                  <span class="mode-desc">Pre-written adventures</span>
                </button>
                <button 
                  class={`mode-button ${aiMode() ? 'active' : ''}`}
                  onClick={() => {
                    if (modelLoader.loadedModel()) {
                      setAiMode(true);
                    } else {
                      setShowModelDownloader(true);
                    }
                  }}
                >
                  🤖 AI Stories
                  <span class="mode-desc">
                    {modelLoader.loadedModel() ? 'Dynamic AI-generated' : 'Download AI model'}
                  </span>
                </button>
              </div>
            </div>
            
            <div class="story-grid">
              <Show when={!aiMode()}>
                <For each={templateStories}>
                  {(story) => (
                    <button
                      class="story-card"
                      data-testid={`story-${story.id}`}
                      onClick={() => startNewStory(story.id)}
                    >
                      <h2 class="story-card-title">{story.name}</h2>
                      <p class="story-card-description">{story.description}</p>
                      <span class="story-card-genre">{story.genre}</span>
                    </button>
                  )}
                </For>
              </Show>
              
              <Show when={aiMode() && modelLoader.loadedModel()}>
                <div class="ai-story-options">
                  <button
                    class="story-card ai-story-card"
                    onClick={() => startAiStory()}
                  >
                    <h2 class="story-card-title">✨ Generate New Adventure</h2>
                    <p class="story-card-description">
                      Let AI create a unique story just for you
                    </p>
                    <span class="story-card-genre">AI-Generated</span>
                  </button>
                  
                  <For each={templateStories}>
                    {(story) => (
                      <button
                        class="story-card ai-enhanced-card"
                        onClick={() => startAiEnhancedStory(story.id)}
                      >
                        <h2 class="story-card-title">🤖 {story.name} (AI Enhanced)</h2>
                        <p class="story-card-description">
                          Start with {story.name}, then continue with AI
                        </p>
                        <span class="story-card-genre">{story.genre} + AI</span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        }
      >
        <div class="game-container">
          <div class="game-header">
            <h2 class="game-title">{gameState().name}</h2>
            <div class="game-stats">
              <span class="stat">Scenes: {gameState().gameProgress.scenesVisited}</span>
              <span class="stat">Choices: {gameState().gameProgress.choicesMade}</span>
            </div>
          </div>
          
          <StoryRenderer
            scene={gameState().currentScene}
            isLoading={isLoading()}
            onChoiceSelect={handleChoiceSelect}
          />
          
          <div class="game-actions">
            <button 
              class="action-button"
              onClick={() => {
                setShowStorySelection(true);
                createNewGame('New Game');
              }}
            >
              New Story
            </button>
            <button 
              class="action-button"
              onClick={async () => {
                await StorageManager.saveGame(gameState());
                alert('Game saved!');
              }}
            >
              Save Game
            </button>
          </div>
        </div>
      </Show>
      
      {/* Model Downloader Modal */}
      <Show when={showModelDownloader()}>
        <ModelDownloader 
          onModelLoaded={handleModelLoaded}
          onCancel={handleCancelDownload}
        />
      </Show>
    </div>
  );
};

export default Home;