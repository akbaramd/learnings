// src/services/logging/LoggingConfig.ts
// Centralized logging configuration

import { ILogger, LogLevel, LoggerFactory, ConsoleLogger } from './ILogger';

export interface LoggingConfig {
  readonly level: LogLevel;
  readonly enableConsole: boolean;
  readonly enableRemoteLogging: boolean;
  readonly remoteEndpoint?: string;
  readonly includeStackTrace: boolean;
  readonly maxLogEntries: number;
}

export class LoggingConfigManager {
  private static config: LoggingConfig = {
    level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableRemoteLogging: false,
    includeStackTrace: process.env.NODE_ENV === 'development',
    maxLogEntries: 1000,
  };

  static getConfig(): LoggingConfig {
    return { ...this.config };
  }

  static updateConfig(updates: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Recreate logger with new config
    const logger = new ConsoleLogger(this.config.level);
    LoggerFactory.setLogger(logger);
  }

  static initializeLogging(): void {
    const logger = new ConsoleLogger(this.config.level);
    LoggerFactory.setLogger(logger);
    
    logger.info('Logging system initialized', {
      config: {
        level: LogLevel[this.config.level],
        enableConsole: this.config.enableConsole,
        environment: process.env.NODE_ENV,
      },
    });
  }
}

// Initialize logging on module load
if (typeof window === 'undefined') {
  // Server-side initialization
  LoggingConfigManager.initializeLogging();
}
