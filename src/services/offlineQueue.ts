interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline = navigator.onLine;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
    this.processQueue();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  public addRequest(url: string, options: RequestInit = {}) {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers as Record<string, string>,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(request);
    this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }

    return request.id;
  }

  private async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    const request = this.queue[0];
    
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      if (response.ok) {
        // Success - remove from queue
        this.queue.shift();
        this.saveQueue();
        
        // Process next request
        setTimeout(() => this.processQueue(), 100);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to process queued request:', error);
      
      request.retryCount++;
      
      if (request.retryCount >= this.maxRetries) {
        // Max retries reached - remove from queue
        this.queue.shift();
        console.error('Max retries reached for request:', request.url);
      }
      
      this.saveQueue();
      
      // Retry after delay
      setTimeout(() => this.processQueue(), this.retryDelay * request.retryCount);
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();