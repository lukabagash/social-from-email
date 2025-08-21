import { randomUUID } from 'crypto';
import { join } from 'path';
import { rmSync, existsSync, mkdirSync } from 'fs';

export interface TemporaryStorageConfig {
  runId: string;
  baseStoragePath: string;
  cleanupOnExit: boolean;
  retainOnError: boolean;
}

export class TemporaryStorageManager {
  private config: TemporaryStorageConfig;
  private cleanupHandlers: (() => void)[] = [];
  private isCleanedUp = false;

  constructor(config: Partial<TemporaryStorageConfig> = {}) {
    this.config = {
      runId: randomUUID(),
      baseStoragePath: join(process.cwd(), 'temp-storage'),
      cleanupOnExit: true,
      retainOnError: false,
      ...config
    };

    // Setup cleanup handlers
    if (this.config.cleanupOnExit) {
      this.setupCleanupHandlers();
    }
  }

  /**
   * Get the storage path for this run
   */
  getStoragePath(): string {
    return join(this.config.baseStoragePath, this.config.runId);
  }

  /**
   * Get the storage path for a specific storage type (datasets, request_queues, etc.)
   */
  getStorageTypePath(storageType: string): string {
    return join(this.getStoragePath(), storageType);
  }

  /**
   * Initialize the temporary storage directory
   */
  initialize(): void {
    const storagePath = this.getStoragePath();
    
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true });
      console.log(`🗂️  Created temporary storage: ${storagePath}`);
    }

    // Create subdirectories for different storage types
    const storageTypes = ['datasets', 'request_queues', 'key_value_stores'];
    storageTypes.forEach(type => {
      const typePath = this.getStorageTypePath(type);
      if (!existsSync(typePath)) {
        mkdirSync(typePath, { recursive: true });
      }
    });
  }

  /**
   * Clean up the temporary storage
   */
  cleanup(force: boolean = false): void {
    if (this.isCleanedUp && !force) {
      return;
    }

    const storagePath = this.getStoragePath();
    
    try {
      if (existsSync(storagePath)) {
        rmSync(storagePath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temporary storage: ${storagePath}`);
      }
      this.isCleanedUp = true;
    } catch (error) {
      console.warn(`⚠️ Failed to clean up temporary storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get Crawlee configuration object for this temporary storage
   */
  getCrawleeConfig() {
    const storagePath = this.getStoragePath();
    
    return {
      storageDir: storagePath,
      persistStorage: false, // Don't persist between runs
      purgeOnStart: true     // Clear any existing data on start
    };
  }

  /**
   * Add a custom cleanup handler
   */
  addCleanupHandler(handler: () => void): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Setup automatic cleanup on process exit
   */
  private setupCleanupHandlers(): void {
    const cleanupWrapper = (signal?: string) => {
      if (signal) {
        console.log(`\n📡 Received ${signal}, cleaning up temporary storage...`);
      }
      
      // Run custom cleanup handlers first
      this.cleanupHandlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.warn(`⚠️ Cleanup handler failed: ${error}`);
        }
      });
      
      // Clean up storage
      this.cleanup();
      
      if (signal) {
        process.exit(0);
      }
    };

    // Handle various exit scenarios
    process.on('exit', () => cleanupWrapper());
    process.on('SIGINT', (signal) => cleanupWrapper(signal));
    process.on('SIGTERM', (signal) => cleanupWrapper(signal));
    process.on('SIGUSR1', (signal) => cleanupWrapper(signal));
    process.on('SIGUSR2', (signal) => cleanupWrapper(signal));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      if (this.config.retainOnError) {
        console.log(`📁 Retaining temporary storage for debugging: ${this.getStoragePath()}`);
      } else {
        cleanupWrapper();
      }
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      if (this.config.retainOnError) {
        console.log(`📁 Retaining temporary storage for debugging: ${this.getStoragePath()}`);
      } else {
        cleanupWrapper();
      }
      process.exit(1);
    });
  }

  /**
   * Get run information
   */
  getRunInfo() {
    return {
      runId: this.config.runId,
      storagePath: this.getStoragePath(),
      isCleanedUp: this.isCleanedUp,
      cleanupOnExit: this.config.cleanupOnExit,
      retainOnError: this.config.retainOnError
    };
  }

  /**
   * Create a child storage manager with a different namespace
   */
  createChild(namespace: string): TemporaryStorageManager {
    return new TemporaryStorageManager({
      ...this.config,
      runId: `${this.config.runId}_${namespace}`,
      cleanupOnExit: false // Parent handles cleanup
    });
  }
}
