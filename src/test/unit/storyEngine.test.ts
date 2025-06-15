import { describe, it, expect, beforeEach } from 'vitest';
import { StoryEngine } from '../../lib/storyEngine';
import { mysteriousPortalStory } from '../../data/templateStories';

describe('StoryEngine', () => {
  let engine: StoryEngine;

  beforeEach(() => {
    engine = new StoryEngine('mysterious-portal');
  });

  describe('startNewStory', () => {
    it('should initialize story with start scene', () => {
      const startScene = engine.startNewStory('mysterious-portal');
      
      expect(startScene).toBeDefined();
      expect(startScene?.id).toBe('portal-intro');
      expect(startScene?.title).toBe('The Mysterious Portal');
      expect(startScene?.choices).toHaveLength(3);
    });

    it('should return null for invalid story ID', () => {
      const startScene = engine.startNewStory('invalid-story');
      expect(startScene).toBeNull();
    });

    it('should mark start scene as visited', () => {
      engine.startNewStory('mysterious-portal');
      expect(engine.hasVisitedScene('portal-intro')).toBe(true);
    });
  });

  describe('makeChoice', () => {
    beforeEach(() => {
      engine.startNewStory('mysterious-portal');
    });

    it('should progress to next scene on valid choice', () => {
      const choice = mysteriousPortalStory.scenes['portal-intro'].choices[0];
      const nextScene = engine.makeChoice(choice);
      
      expect(nextScene).toBeDefined();
      expect(nextScene?.id).toBe(choice.nextSceneId);
      expect(engine.hasVisitedScene(choice.nextSceneId!)).toBe(true);
    });

    it('should return null for choice without nextSceneId', () => {
      const choice = { 
        id: 'invalid', 
        text: 'Invalid choice', 
        consequence: 'None',
        impact: { narrative: 0, character: 0, world: 0 }
      };
      const nextScene = engine.makeChoice(choice);
      expect(nextScene).toBeNull();
    });

    it('should return null for invalid scene ID', () => {
      const choice = { 
        id: 'invalid', 
        text: 'Invalid choice', 
        consequence: 'None',
        nextSceneId: 'non-existent-scene',
        impact: { narrative: 0, character: 0, world: 0 }
      };
      const nextScene = engine.makeChoice(choice);
      expect(nextScene).toBeNull();
    });
  });

  describe('getProgressPercentage', () => {
    it('should return 0 for invalid story', () => {
      const invalidEngine = new StoryEngine('invalid');
      expect(invalidEngine.getProgressPercentage()).toBe(0);
    });

    it('should calculate progress correctly', () => {
      engine.startNewStory('mysterious-portal');
      const totalScenes = Object.keys(mysteriousPortalStory.scenes).length;
      const expectedProgress = Math.round((1 / totalScenes) * 100);
      
      expect(engine.getProgressPercentage()).toBe(expectedProgress);
    });

    it('should increase progress as scenes are visited', () => {
      engine.startNewStory('mysterious-portal');
      const initialProgress = engine.getProgressPercentage();
      
      const choice = mysteriousPortalStory.scenes['portal-intro'].choices[0];
      engine.makeChoice(choice);
      
      const updatedProgress = engine.getProgressPercentage();
      expect(updatedProgress).toBeGreaterThan(initialProgress);
    });
  });

  describe('isEndingScene', () => {
    it('should identify ending scenes correctly', () => {
      const endingScene = {
        id: 'ending',
        title: 'The End',
        content: 'Story complete',
        choices: [{
          id: 'new-game',
          text: 'Start New Game',
          consequence: 'Begin again',
          impact: { narrative: 0, character: 0, world: 0 }
        }],
        entities: [],
        metadata: {
          genre: 'fantasy',
          tone: 'conclusive',
          themes: ['ending'],
          estimatedReadTime: 1
        }
      };

      expect(engine.isEndingScene(endingScene)).toBe(true);
    });

    it('should not identify regular scenes as endings', () => {
      const regularScene = mysteriousPortalStory.scenes['portal-intro'];
      expect(engine.isEndingScene(regularScene)).toBe(false);
    });
  });

  describe('getStoryMetadata', () => {
    it('should return story metadata', () => {
      engine.startNewStory('mysterious-portal');
      const metadata = engine.getStoryMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('mysterious-portal');
      expect(metadata?.name).toBe('The Mysterious Portal');
      expect(metadata?.genre).toBe('fantasy');
      expect(metadata?.totalScenes).toBeGreaterThan(0);
      expect(metadata?.progress).toBeGreaterThan(0);
    });

    it('should return null for invalid story', () => {
      const invalidEngine = new StoryEngine('invalid');
      const metadata = invalidEngine.getStoryMetadata();
      expect(metadata).toBeNull();
    });
  });

  describe('saveState and restoreState', () => {
    it('should save and restore engine state', () => {
      engine.startNewStory('mysterious-portal');
      const choice = mysteriousPortalStory.scenes['portal-intro'].choices[0];
      engine.makeChoice(choice);
      
      const savedState = engine.saveState();
      const newEngine = new StoryEngine('other-story');
      newEngine.restoreState(savedState);
      
      expect(newEngine.hasVisitedScene('portal-intro')).toBe(true);
      expect(newEngine.hasVisitedScene(choice.nextSceneId!)).toBe(true);
    });
  });

  describe('getAvailableStories', () => {
    it('should return array of available stories', () => {
      const stories = StoryEngine.getAvailableStories();
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBeGreaterThan(0);
      expect(stories[0]).toHaveProperty('id');
      expect(stories[0]).toHaveProperty('name');
      expect(stories[0]).toHaveProperty('genre');
    });
  });
});