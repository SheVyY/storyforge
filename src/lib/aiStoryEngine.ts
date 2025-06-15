import { type Scene, type Choice } from '../types';
import { modelLoader } from './modelLoader';

export interface StoryContext {
  currentScene?: Scene;
  playerChoices: Choice[];
  gameProgress: {
    scenesVisited: number;
    choicesMade: number;
  };
  entities: {
    characters: string[];
    locations: string[];
    themes: string[];
  };
}

export class AIStoryEngine {
  private isEnabled = false;
  
  async initialize(): Promise<boolean> {
    try {
      // Check if WebLLM is supported  
      if (!(modelLoader.constructor as any).isSupported()) {
        console.warn('WebLLM not supported in this browser');
        return false;
      }

      this.isEnabled = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Story Engine:', error);
      return false;
    }
  }

  get ready(): boolean {
    return this.isEnabled && modelLoader.isReady;
  }

  async generateNextScene(
    choice: Choice,
    context: StoryContext
  ): Promise<Scene | null> {
    if (!this.ready) {
      console.warn('AI Story Engine not ready');
      return null;
    }

    try {
      const prompt = this.buildStoryPrompt(choice, context);
      const response = await modelLoader.generateResponse(prompt);
      const scene = this.parseSceneFromResponse(response);
      
      return scene;
    } catch (error) {
      console.error('Failed to generate next scene:', error);
      return null;
    }
  }

  private buildStoryPrompt(choice: Choice, context: StoryContext): string {
    const { currentScene, playerChoices, gameProgress, entities } = context;
    
    // Build context summary
    const recentChoices = playerChoices.slice(-3).map(c => c.text).join('; ');
    const themes = entities.themes.join(', ') || 'adventure, mystery';
    const characters = entities.characters.join(', ') || 'you';
    const locations = entities.locations.join(', ') || 'unknown realm';

    const systemPrompt = `You are a masterful interactive fiction writer creating an immersive fantasy adventure.

RULES:
- Write in second person ("You...")
- Keep the scene to 100-200 words
- Generate exactly 3 meaningful choices
- Maintain story consistency and flow
- Focus on immersive, engaging narrative
- Each choice should lead to different story directions

CURRENT STORY CONTEXT:
- Player just chose: "${choice.text}"
- Previous scene: "${currentScene?.title || 'Beginning'}"
- Recent choices: ${recentChoices}
- Themes: ${themes}
- Characters: ${characters}
- Locations: ${locations}
- Scenes visited: ${gameProgress.scenesVisited}

RESPONSE FORMAT:
Title: [Scene Title]

[Scene content paragraph]

Choices:
1. [Choice 1]
2. [Choice 2] 
3. [Choice 3]`;

    return systemPrompt;
  }

  parseSceneFromResponse(response: string): Scene {
    console.log('Parsing AI response:', response);

    // Extract title
    const titleMatch = response.match(/Title:\s*(.+)/i);
    const title = titleMatch?.[1]?.trim() || 'Untitled Scene';

    // Extract content (everything between title and "Choices:")
    const contentMatch = response.match(/Title:.*?\n\n?(.*?)(?=Choices:|$)/s);
    let content = contentMatch?.[1]?.trim() || 'The story continues...';
    
    // Wrap content in paragraph tags if not already wrapped
    if (!content.startsWith('<p>')) {
      content = `<p>${content}</p>`;
    }

    // Extract choices
    const choicesMatch = response.match(/Choices?:\s*\n?(.*)/s);
    const choicesText = choicesMatch?.[1] || '';
    
    const choices: Choice[] = [];
    const choiceLines = choicesText.split('\n').filter(line => line.trim());
    
    choiceLines.forEach((line, index) => {
      // Match numbered choices (1., 2., 3.) or bullet points
      const choiceMatch = line.match(/^\s*[1-3\-\*]\.\s*(.+)/);
      if (choiceMatch && index < 3) {
        const choiceText = choiceMatch[1].trim();
        choices.push({
          id: `ai-choice-${index + 1}`,
          text: choiceText,
          consequence: 'Your choice shapes the story...',
          nextSceneId: `ai-scene-${Date.now()}-${index + 1}`,
          impact: { narrative: 7, character: 5, world: 6 }
        });
      }
    });

    // Ensure we have at least 3 choices
    while (choices.length < 3) {
      choices.push({
        id: `ai-choice-fallback-${choices.length + 1}`,
        text: 'Continue forward',
        consequence: 'The adventure continues...',
        nextSceneId: `ai-scene-${Date.now()}-fallback`,
        impact: { narrative: 5, character: 3, world: 4 }
      });
    }

    const scene: Scene = {
      id: `ai-scene-${Date.now()}`,
      title,
      content,
      choices: choices.slice(0, 3), // Limit to 3 choices
      entities: [
        {
          id: 'ai-narrator',
          name: 'AI Narrator',
          type: 'system',
          properties: { aiGenerated: true }
        }
      ],
      metadata: {
        genre: 'fantasy',
        tone: 'adventurous',
        themes: ['ai-generated', 'dynamic'],
        estimatedReadTime: 2,
        aiGenerated: true
      }
    };

    console.log('Generated scene:', scene);
    return scene;
  }

  // Extract entities from generated content for consistency tracking
  extractEntities(scene: Scene): {
    characters: string[];
    locations: string[];
    themes: string[];
  } {
    const content = scene.content.toLowerCase();
    
    // Simple entity extraction (this could be made more sophisticated)
    const characters = [];
    const locations = [];
    const themes = ['adventure'];

    // Look for character mentions
    if (content.includes('companion') || content.includes('ally')) {
      characters.push('companion');
    }
    if (content.includes('enemy') || content.includes('foe')) {
      characters.push('enemy');
    }
    if (content.includes('merchant') || content.includes('trader')) {
      characters.push('merchant');
    }

    // Look for location mentions  
    if (content.includes('forest') || content.includes('woods')) {
      locations.push('forest');
    }
    if (content.includes('castle') || content.includes('fortress')) {
      locations.push('castle');
    }
    if (content.includes('village') || content.includes('town')) {
      locations.push('village');
    }
    if (content.includes('mountain') || content.includes('peak')) {
      locations.push('mountain');
    }

    // Look for theme indicators
    if (content.includes('magic') || content.includes('spell')) {
      themes.push('magic');
    }
    if (content.includes('danger') || content.includes('threat')) {
      themes.push('danger');
    }
    if (content.includes('treasure') || content.includes('gold')) {
      themes.push('treasure');
    }

    return { characters, locations, themes };
  }
}

// Singleton instance
export const aiStoryEngine = new AIStoryEngine();