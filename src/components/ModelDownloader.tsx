import { type Component, createSignal, Show, For } from 'solid-js';
import { modelLoader, AVAILABLE_MODELS, type ModelConfig } from '../lib/modelLoader';
import { aiStoryEngine } from '../lib/aiStoryEngine';
import './ModelDownloader.css';

interface ModelDownloaderProps {
  onModelLoaded?: (modelId: string) => void;
  onCancel?: () => void;
}

const ModelDownloader: Component<ModelDownloaderProps> = (props) => {
  const [selectedModel, setSelectedModel] = createSignal<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [supportStatus, setSupportStatus] = createSignal<'checking' | 'supported' | 'unsupported'>('checking');

  // Check WebLLM support on mount
  setTimeout(() => {
    const isSupported = (modelLoader.constructor as any).isSupported();
    setSupportStatus(isSupported ? 'supported' : 'unsupported');
  }, 100);

  const handleDownloadModel = async (model: ModelConfig) => {
    setSelectedModel(model);
    setIsLoading(true);

    try {
      console.log(`Starting download of ${model.name}`);
      
      // Initialize AI engine first
      await aiStoryEngine.initialize();
      
      // Load the selected model
      await modelLoader.loadModel(model);
      
      console.log(`✅ ${model.name} loaded successfully`);
      props.onModelLoaded?.(model.id);
      
    } catch (error) {
      console.error('Failed to download model:', error);
      // Error is handled by modelLoader's error signal
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEstimatedDownloadTime = (sizeStr: string): string => {
    // Very rough estimation based on typical broadband speeds
    const sizeGB = parseFloat(sizeStr.replace(/[^0-9.]/g, ''));
    const estimatedMinutes = Math.ceil(sizeGB * 2); // ~2 minutes per GB on average connection
    return estimatedMinutes < 5 ? 'a few minutes' : `~${estimatedMinutes} minutes`;
  };

  return (
    <div class="model-downloader">
      <div class="model-downloader-content">
        <h2 class="downloader-title">Enable AI Story Generation</h2>
        
        <Show when={supportStatus() === 'checking'}>
          <div class="support-checking">
            <div class="loading-spinner"></div>
            <p>Checking browser compatibility...</p>
          </div>
        </Show>

        <Show when={supportStatus() === 'unsupported'}>
          <div class="support-error">
            <h3>🚫 Browser Not Supported</h3>
            <p>AI story generation requires:</p>
            <ul>
              <li>WebGPU support (Chrome 113+, Edge 113+)</li>
              <li>SharedArrayBuffer enabled</li>
              <li>Secure context (HTTPS)</li>
            </ul>
            <p>Please use a modern browser or enable required features.</p>
            <button class="cancel-button" onClick={props.onCancel}>
              Continue with Template Stories
            </button>
          </div>
        </Show>

        <Show when={supportStatus() === 'supported'}>
          <Show when={!isLoading() && !modelLoader.loadedModel()}>
            <div class="model-selection">
              <p class="downloader-description">
                Choose an AI model to download for offline story generation. 
                The model will be cached for future use.
              </p>

              <div class="models-grid">
                <For each={AVAILABLE_MODELS}>
                  {(model) => (
                    <div class="model-card">
                      <div class="model-info">
                        <h3 class="model-name">{model.name}</h3>
                        <p class="model-description">{model.description}</p>
                        <div class="model-details">
                          <span class="model-size">Size: {model.size}</span>
                          <span class="model-time">
                            Download: {getEstimatedDownloadTime(model.size)}
                          </span>
                        </div>
                      </div>
                      <button 
                        class="download-button"
                        onClick={() => handleDownloadModel(model)}
                      >
                        Download {model.name}
                      </button>
                    </div>
                  )}
                </For>
              </div>

              <div class="downloader-actions">
                <button class="cancel-button" onClick={props.onCancel}>
                  Continue with Template Stories
                </button>
              </div>
            </div>
          </Show>

          <Show when={isLoading()}>
            <div class="download-progress">
              <h3>Downloading {selectedModel()?.name}...</h3>
              
              <Show when={modelLoader.loadingProgress()}>
                {(progress) => (
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill"
                        style={{ width: `${progress().percent}%` }}
                      ></div>
                    </div>
                    <div class="progress-details">
                      <span class="progress-percent">{progress().percent}%</span>
                      <span class="progress-stage">{progress().stage}</span>
                    </div>
                    <Show when={progress().total > 0}>
                      <div class="progress-size">
                        {formatBytes(progress().loaded * 1024 * 1024)} / {formatBytes(progress().total * 1024 * 1024)}
                      </div>
                    </Show>
                  </div>
                )}
              </Show>

              <div class="download-tips">
                <h4>💡 While you wait:</h4>
                <ul>
                  <li>Keep this tab active for best download performance</li>
                  <li>The model will be cached for future use</li>
                  <li>You can play template stories in another tab</li>
                </ul>
              </div>
            </div>
          </Show>

          <Show when={modelLoader.error()}>
            <div class="download-error">
              <h3>❌ Download Failed</h3>
              <p>{modelLoader.error()}</p>
              <div class="error-actions">
                <button 
                  class="retry-button"
                  onClick={() => selectedModel() && handleDownloadModel(selectedModel()!)}
                >
                  Try Again
                </button>
                <button class="cancel-button" onClick={props.onCancel}>
                  Continue with Templates
                </button>
              </div>
            </div>
          </Show>

          <Show when={modelLoader.loadedModel()}>
            <div class="download-success">
              <h3>✅ AI Model Ready!</h3>
              <p>
                <strong>{AVAILABLE_MODELS.find(m => m.id === modelLoader.loadedModel())?.name}</strong> 
                {' '}is now loaded and ready to generate dynamic stories.
              </p>
              <button 
                class="continue-button"
                onClick={() => props.onModelLoaded?.(modelLoader.loadedModel()!)}
              >
                Start AI Story Mode
              </button>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default ModelDownloader;