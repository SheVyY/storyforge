import { type Component } from 'solid-js';

const Settings: Component = () => {
  return (
    <div class="settings-page">
      <h1>Settings</h1>
      <p>Model configuration and preferences will be available here in Phase 2.</p>
      
      <div class="settings-placeholder">
        <h2>Coming Soon:</h2>
        <ul>
          <li>AI Model Selection</li>
          <li>Generation Parameters</li>
          <li>Story Preferences</li>
          <li>Accessibility Options</li>
          <li>Performance Settings</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;