// src/services/logging/ILogger.ts
// Logging abstraction following DIP

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;
  readonly error?: unknown;
}

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
}

// Console logger implementation
export class ConsoleLogger implements ILogger {
  constructor(private readonly minLevel: LogLevel = LogLevel.INFO) {}

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context ? { context } : '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context ? { context } : '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context ? { context } : '');
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        error: this.serializeError(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      console.error(`[ERROR] ${message}`, errorContext);
    }
  }

  private serializeError(error: unknown): unknown {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.parse(JSON.stringify(error));
      } catch {
        return String(error);
      }
    }
    
    return error;
  }
}

// Logger factory for dependency injection
export class LoggerFactory {
  private static instance: ILogger | null = null;

  static getLogger(): ILogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger(
        process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
      );
    }
    return this.instance;
  }

  static setLogger(logger: ILogger): void {
    this.instance = logger;
  }
}
