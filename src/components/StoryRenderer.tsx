import { type Component, For, Show } from 'solid-js';
import { type Scene, type Choice } from '../types';
import './StoryRenderer.css';

interface StoryRendererProps {
  scene: Scene;
  isLoading?: boolean;
  onChoiceSelect: (choice: Choice) => void;
}

const StoryRenderer: Component<StoryRendererProps> = (props) => {
  return (
    <div class="story-renderer">
      <Show when={!props.isLoading} fallback={<div class="story-loading">Generating story...</div>}>
        <article class="story-content">
          <h2 class="story-title">{props.scene.title}</h2>
          <div class="story-text" innerHTML={props.scene.content} />
        </article>
        
        <div class="choices-container">
          <h3 class="choices-title">What do you do?</h3>
          <div class="choices-list">
            <For each={props.scene.choices}>
              {(choice) => (
                <button
                  class="choice-button"
                  onClick={() => props.onChoiceSelect(choice)}
                >
                  <span class="choice-text">{choice.text}</span>
                  <Show when={choice.consequence}>
                    <span class="choice-hint">{choice.consequence}</span>
                  </Show>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default StoryRenderer;