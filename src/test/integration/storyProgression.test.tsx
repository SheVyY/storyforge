import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { GameStateProvider } from '../../lib/simpleState';
import Home from '../../pages/Home';

describe('Story Progression Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should progress story when choice is clicked', async () => {
    render(() => (
      <GameStateProvider>
        <Home />
      </GameStateProvider>
    ));

    // Should start with story selection
    expect(screen.getByText('Choose Your Adventure')).toBeInTheDocument();
    
    // Start mysterious portal story
    const portalStory = screen.getByText('The Mysterious Portal');
    fireEvent.click(portalStory);

    // Wait for story to load
    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Should show initial scene content
    expect(screen.getByText((content, element) => {
      return element?.textContent?.includes('You stand before an ancient stone archway') || false;
    })).toBeInTheDocument();

    // Should show three choices
    const choiceButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Step through') || 
      button.textContent?.includes('Study the runes') || 
      button.textContent?.includes('Call out')
    );
    expect(choiceButtons).toHaveLength(3);

    // Get initial scene stats
    const initialScenesVisited = screen.getByText('Scenes: 1');
    const initialChoicesMade = screen.getByText('Choices: 0');
    
    expect(initialScenesVisited).toBeInTheDocument();
    expect(initialChoicesMade).toBeInTheDocument();

    // Click the first choice (Step through the portal boldly)
    const firstChoice = choiceButtons.find(button => 
      button.textContent?.includes('Step through')
    );
    expect(firstChoice).toBeDefined();
    
    fireEvent.click(firstChoice!);

    // Wait for the story to progress
    await waitFor(() => {
      // Check if scenes visited increased
      expect(screen.getByText('Scenes: 2')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check if choices made increased
    expect(screen.getByText('Choices: 1')).toBeInTheDocument();

    // Should have a new scene with different content
    // The content should have changed from the initial scene
    expect(screen.queryByText((content, element) => {
      return element?.textContent?.includes('You stand before an ancient stone archway') || false;
    })).not.toBeInTheDocument();

    // Should have new choices available (indicating we progressed to a new scene)
    const newChoiceButtons = screen.getAllByRole('button').filter(button => 
      !button.textContent?.includes('New Story') && 
      !button.textContent?.includes('Save Game')
    );
    expect(newChoiceButtons.length).toBeGreaterThan(0);
  });

  it('should handle choice selection and maintain story state', async () => {
    render(() => (
      <GameStateProvider>
        <Home />
      </GameStateProvider>
    ));

    // Start story
    fireEvent.click(screen.getByText('The Mysterious Portal'));
    
    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Make first choice
    const studyRunesChoice = screen.getByText('Study the runes carefully first');
    fireEvent.click(studyRunesChoice);

    // Wait for progression
    await waitFor(() => {
      expect(screen.getByText('Choices: 1')).toBeInTheDocument();
    });

    // Make second choice
    const choiceButtons = screen.getAllByRole('button').filter(button => 
      !button.textContent?.includes('New Story') && 
      !button.textContent?.includes('Save Game')
    );
    
    if (choiceButtons.length > 0) {
      fireEvent.click(choiceButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Choices: 2')).toBeInTheDocument();
      });
    }

    // Verify final state
    const finalScenes = screen.getByText(/Scenes: \d+/);
    const finalChoices = screen.getByText(/Choices: \d+/);
    
    expect(finalScenes).toBeInTheDocument();
    expect(finalChoices).toBeInTheDocument();
  });

  it('should handle story restart', async () => {
    render(() => (
      <GameStateProvider>
        <Home />
      </GameStateProvider>
    ));

    // Start and progress story
    fireEvent.click(screen.getByText('The Mysterious Portal'));
    
    await waitFor(() => {
      expect(screen.getByText('The Mysterious Portal')).toBeInTheDocument();
    });

    // Make a choice to progress
    const firstChoice = screen.getByText('Step through the portal boldly');
    fireEvent.click(firstChoice);

    await waitFor(() => {
      expect(screen.getByText('Choices: 1')).toBeInTheDocument();
    });

    // Click "New Story" button
    const newStoryButton = screen.getByText('New Story');
    fireEvent.click(newStoryButton);

    // Should return to story selection
    await waitFor(() => {
      expect(screen.getByText('Choose Your Adventure')).toBeInTheDocument();
    });

    // Game state should be reset
    // When we start a new story, stats should reset
    fireEvent.click(screen.getByText('The Mysterious Portal'));
    
    await waitFor(() => {
      expect(screen.getByText('Scenes: 1')).toBeInTheDocument();
      expect(screen.getByText('Choices: 0')).toBeInTheDocument();
    });
  });
});