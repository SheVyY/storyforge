export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const newWorker = this.registration!.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker installed, reload recommended');
              // Could show update notification to user here
            }
          });
        }
      });

      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        console.log('Service Worker waiting');
      }

      
      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async sendMessage(type: string, data?: any): Promise<any> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.data);
        } else {
          reject(new Error(event.data.error));
        }
      };

      if (this.registration?.active) {
        this.registration.active.postMessage(
          { type, data },
          [messageChannel.port2]
        );
      } else {
        reject(new Error('No active Service Worker'));
      }
    });
  }

  async cacheModel(modelData: { id: string; weights: ArrayBuffer; version: string }) {
    return this.sendMessage('CACHE_MODEL', modelData);
  }

  async getCacheInfo() {
    return this.sendMessage('GET_CACHE_INFO');
  }

  async clearCache() {
    return this.sendMessage('CLEAR_CACHE');
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return true;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();