import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import StoryRenderer from '../../components/StoryRenderer';
import { type Scene } from '../../types';

const mockScene: Scene = {
  id: 'test-scene',
  title: 'Test Scene Title',
  content: '<p>This is test content with <strong>bold text</strong>.</p>',
  choices: [
    {
      id: 'choice-1',
      text: 'First choice',
      consequence: 'This leads to adventure',
      impact: { narrative: 8, character: 6, world: 7 }
    },
    {
      id: 'choice-2', 
      text: 'Second choice',
      consequence: 'This leads to danger',
      impact: { narrative: 6, character: 8, world: 5 }
    },
    {
      id: 'choice-3',
      text: 'Third choice',
      consequence: '',
      impact: { narrative: 7, character: 5, world: 8 }
    }
  ],
  entities: [],
  metadata: {
    genre: 'test',
    tone: 'testing',
    themes: ['test'],
    estimatedReadTime: 2
  }
};

describe('StoryRenderer', () => {
  it('should render scene title and content', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('Test Scene Title')).toBeInTheDocument();
    expect(screen.getByText('bold text')).toBeInTheDocument();
    
    // Check that the story content container has the expected text
    const storyText = document.querySelector('.story-text');
    expect(storyText?.textContent).toContain('This is test content with');
  });

  it('should render all choices', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('First choice')).toBeInTheDocument();
    expect(screen.getByText('Second choice')).toBeInTheDocument();
    expect(screen.getByText('Third choice')).toBeInTheDocument();
    
    expect(screen.getByText('This leads to adventure')).toBeInTheDocument();
    expect(screen.getByText('This leads to danger')).toBeInTheDocument();
  });

  it('should not render consequence text when empty', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    // Third choice has empty consequence, so the hint span should not be visible
    const choiceButtons = screen.getAllByRole('button');
    const thirdChoiceButton = choiceButtons.find(button => 
      button.textContent?.includes('Third choice')
    );
    
    expect(thirdChoiceButton).toBeInTheDocument();
    // Should not contain any consequence text for third choice
    expect(thirdChoiceButton?.textContent).toBe('Third choice');
  });

  it('should call onChoiceSelect when choice is clicked', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    const firstChoiceButton = screen.getByText('First choice').closest('button');
    expect(firstChoiceButton).toBeInTheDocument();
    
    fireEvent.click(firstChoiceButton!);
    
    expect(mockOnChoiceSelect).toHaveBeenCalledTimes(1);
    expect(mockOnChoiceSelect).toHaveBeenCalledWith(mockScene.choices[0]);
  });

  it('should call onChoiceSelect with correct choice data', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    // Click second choice
    const secondChoiceButton = screen.getByText('Second choice').closest('button');
    fireEvent.click(secondChoiceButton!);
    
    expect(mockOnChoiceSelect).toHaveBeenCalledWith(mockScene.choices[1]);
    expect(mockOnChoiceSelect).toHaveBeenCalledWith(expect.objectContaining({
      id: 'choice-2',
      text: 'Second choice',
      consequence: 'This leads to danger'
    }));
  });

  it('should show loading state', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={true}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('Generating story...')).toBeInTheDocument();
    expect(screen.queryByText('Test Scene Title')).not.toBeInTheDocument();
    expect(screen.queryByText('First choice')).not.toBeInTheDocument();
  });

  it('should render choices section header', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('What do you do?')).toBeInTheDocument();
  });

  it('should handle scene with no choices', () => {
    const sceneWithoutChoices: Scene = {
      ...mockScene,
      choices: []
    };
    
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={sceneWithoutChoices}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('Test Scene Title')).toBeInTheDocument();
    expect(screen.getByText('What do you do?')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render HTML content correctly', () => {
    const sceneWithComplexContent: Scene = {
      ...mockScene,
      content: '<p>Paragraph 1</p><p>Paragraph 2 with <em>italic</em> and <strong>bold</strong>.</p><ul><li>List item</li></ul>'
    };
    
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={sceneWithComplexContent}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('List item')).toBeInTheDocument();
    
    // Check that the story content has the correct structure
    const storyText = document.querySelector('.story-text');
    expect(storyText?.textContent).toContain('Paragraph 2 with');
  });

  it('should have proper CSS classes', () => {
    const mockOnChoiceSelect = vi.fn();
    
    render(() => (
      <StoryRenderer 
        scene={mockScene}
        isLoading={false}
        onChoiceSelect={mockOnChoiceSelect}
      />
    ));
    
    expect(document.querySelector('.story-renderer')).toBeInTheDocument();
    expect(document.querySelector('.story-content')).toBeInTheDocument();
    expect(document.querySelector('.story-title')).toBeInTheDocument();
    expect(document.querySelector('.story-text')).toBeInTheDocument();
    expect(document.querySelector('.choices-container')).toBeInTheDocument();
    expect(document.querySelector('.choices-list')).toBeInTheDocument();
    expect(document.querySelector('.choice-button')).toBeInTheDocument();
  });
});