import { type Scene, type Choice } from '../types';
import { getScene, getTemplateStory, templateStories, type StoryTemplate } from '../data/templateStories';

export class StoryEngine {
  private currentStoryId: string;
  private visitedScenes: Set<string> = new Set();
  
  constructor(storyId: string) {
    this.currentStoryId = storyId;
  }

  /**
   * Initialize a new story from a template
   */
  startNewStory(storyId: string): Scene | null {
    const story = getTemplateStory(storyId);
    if (!story) return null;
    
    this.currentStoryId = storyId;
    this.visitedScenes.clear();
    
    const startScene = story.scenes[story.startSceneId];
    if (startScene) {
      this.visitedScenes.add(startScene.id);
    }
    
    return startScene;
  }

  /**
   * Progress to the next scene based on a choice
   */
  makeChoice(choice: Choice): Scene | null {
    if (!choice.nextSceneId) return null;
    
    const nextScene = getScene(this.currentStoryId, choice.nextSceneId);
    if (nextScene) {
      this.visitedScenes.add(nextScene.id);
    }
    
    return nextScene ? nextScene : null;
  }

  /**
   * Get a specific scene by ID
   */
  getSceneById(sceneId: string): Scene | null {
    const scene = getScene(this.currentStoryId, sceneId);
    return scene ? scene : null;
  }

  /**
   * Check if a scene has been visited
   */
  hasVisitedScene(sceneId: string): boolean {
    return this.visitedScenes.has(sceneId);
  }

  /**
   * Get story progress percentage
   */
  getProgressPercentage(): number {
    const story = getTemplateStory(this.currentStoryId);
    if (!story) return 0;
    
    const totalScenes = Object.keys(story.scenes).length;
    const visitedCount = this.visitedScenes.size;
    
    return Math.round((visitedCount / totalScenes) * 100);
  }

  /**
   * Get available story templates
   */
  static getAvailableStories(): StoryTemplate[] {
    return templateStories;
  }

  /**
   * Save engine state
   */
  saveState() {
    return {
      currentStoryId: this.currentStoryId,
      visitedScenes: Array.from(this.visitedScenes)
    };
  }

  /**
   * Restore engine state
   */
  restoreState(state: { currentStoryId: string; visitedScenes: string[] }) {
    this.currentStoryId = state.currentStoryId;
    this.visitedScenes = new Set(state.visitedScenes);
  }

  /**
   * Check if the current scene is an ending
   */
  isEndingScene(scene: Scene): boolean {
    // A scene is an ending if it has only one choice that leads nowhere
    // or if the choice explicitly indicates a new game
    return scene.choices.length === 1 && 
           (scene.choices[0].id === 'new-game' || !scene.choices[0].nextSceneId);
  }

  /**
   * Get story metadata
   */
  getStoryMetadata() {
    const story = getTemplateStory(this.currentStoryId);
    if (!story) return null;
    
    return {
      id: story.id,
      name: story.name,
      description: story.description,
      genre: story.genre,
      totalScenes: Object.keys(story.scenes).length,
      visitedScenes: this.visitedScenes.size,
      progress: this.getProgressPercentage()
    };
  }

  /**
   * Calculate estimated remaining time
   */
  getEstimatedRemainingTime(): number {
    const story = getTemplateStory(this.currentStoryId);
    if (!story) return 0;
    
    const remainingScenes = Object.keys(story.scenes).length - this.visitedScenes.size;
    const avgTimePerScene = 2; // minutes
    
    return remainingScenes * avgTimePerScene;
  }
}