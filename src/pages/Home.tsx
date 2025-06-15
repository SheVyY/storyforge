import { type Component, createSignal, onMount, Show, For } from 'solid-js';
import StoryRenderer from '../components/StoryRenderer';
import { type Choice } from '../types';
import { StoryEngine } from '../lib/storyEngine';
import { templateStories } from '../data/templateStories';
import { useGameState } from '../lib/simpleState';
import { StorageManager } from '../lib/storage';
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
  const [storyEngine, setStoryEngine] = createSignal<StoryEngine | null>(null);

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
      createNewGame(templateStories.find(s => s.id === storyId)?.name || 'New Game');
      setCurrentScene(startScene);
      updateProgress({ scenesVisited: 1 });
      setShowStorySelection(false);
    }
  };

  const handleChoiceSelect = async (choice: Choice) => {
    setIsLoading(true);
    
    try {
      // Add choice to history
      addPlayerChoice(choice);
      
      // Use story engine to get next scene
      const engine = storyEngine();
      if (engine && choice.nextSceneId) {
        const nextScene = engine.makeChoice(choice);
        
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
            <div class="story-grid">
              <For each={templateStories}>
                {(story) => (
                  <button
                    class="story-card"
                    onClick={() => startNewStory(story.id)}
                  >
                    <h2 class="story-card-title">{story.name}</h2>
                    <p class="story-card-description">{story.description}</p>
                    <span class="story-card-genre">{story.genre}</span>
                  </button>
                )}
              </For>
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
    </div>
  );
};

export default Home;