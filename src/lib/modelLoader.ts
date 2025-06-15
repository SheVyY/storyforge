import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';
import { createSignal } from 'solid-js';

export interface ModelConfig {
  id: string;
  name: string;
  size: string;
  description: string;
  modelId: string; // WebLLM model ID
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'phi-3-mini',
    name: 'Phi-3 Mini',
    size: '~1.8GB',
    description: 'Fast and high-quality, best for most users',
    modelId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC'
  },
  {
    id: 'qwen2-0.5b',
    name: 'Qwen2 0.5B',
    size: '~400MB', 
    description: 'Ultra-fast, good for slower devices',
    modelId: 'Qwen2-0.5B-Instruct-q4f16_1-MLC'
  }
];

export interface LoadingProgress {
  loaded: number;
  total: number;
  percent: number;
  stage: string;
  timeRemaining?: number;
}

class ModelLoaderService {
  private engine: MLCEngine | null = null;
  private loadingSignal = createSignal<LoadingProgress | null>(null);
  private loadedModelSignal = createSignal<string | null>(null);
  private errorSignal = createSignal<string | null>(null);

  get loadingProgress() {
    return this.loadingSignal[0];
  }

  get loadedModel() {
    return this.loadedModelSignal[0];
  }

  get error() {
    return this.errorSignal[0];
  }

  get isReady() {
    return this.engine !== null && this.loadedModel() !== null;
  }

  async loadModel(modelConfig: ModelConfig): Promise<MLCEngine> {
    try {
      this.errorSignal[1](null);
      this.loadingSignal[1]({
        loaded: 0,
        total: 100,
        percent: 0,
        stage: 'Initializing...'
      });

      console.log(`Loading model: ${modelConfig.name} (${modelConfig.modelId})`);

      const engine = await CreateMLCEngine(
        modelConfig.modelId,
        {
          initProgressCallback: (progress) => {
            console.log('Model loading progress:', progress);
            
            // Parse progress info from WebLLM
            const stage = progress.text || 'Loading...';
            let loaded = 0;
            let total = 100;
            
            // Extract progress from text if available
            const progressMatch = progress.text?.match(/(\d+)\/(\d+)/);
            if (progressMatch) {
              loaded = parseInt(progressMatch[1]);
              total = parseInt(progressMatch[2]);
            } else if (progress.progress !== undefined) {
              loaded = Math.round(progress.progress * 100);
              total = 100;
            }

            const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;

            this.loadingSignal[1]({
              loaded,
              total,
              percent,
              stage
            });
          }
        }
      );

      this.engine = engine;
      this.loadedModelSignal[1](modelConfig.id);
      this.loadingSignal[1](null);

      console.log(`✅ Model ${modelConfig.name} loaded successfully`);
      return engine;

    } catch (error) {
      console.error('Failed to load model:', error);
      this.errorSignal[1](error instanceof Error ? error.message : 'Failed to load model');
      this.loadingSignal[1](null);
      throw error;
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.engine) {
      throw new Error('No model loaded');
    }

    try {
      console.log('Generating response for prompt:', prompt.substring(0, 100) + '...');
      
      const completion = await this.engine.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || '';
      console.log('Generated response:', response.substring(0, 100) + '...');
      
      return response;

    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  async unloadModel(): Promise<void> {
    if (this.engine) {
      console.log('Unloading model...');
      // Note: WebLLM doesn't have explicit unload, but we can clear our reference
      this.engine = null;
      this.loadedModelSignal[1](null);
      console.log('✅ Model unloaded');
    }
  }

  // Check if WebLLM is supported in this browser
  static isSupported(): boolean {
    try {
      // Check for WebGPU support
      if (!(navigator as any).gpu) {
        console.warn('WebGPU not supported - WebLLM requires WebGPU');
        return false;
      }

      // Check for SharedArrayBuffer (required for WebLLM)
      if (typeof SharedArrayBuffer === 'undefined') {
        console.warn('SharedArrayBuffer not available - WebLLM requires SharedArrayBuffer');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking WebLLM support:', error);
      return false;
    }
  }
}

// Singleton instance
export const modelLoader = new ModelLoaderService();